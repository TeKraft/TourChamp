'use strict';
const React = require('react');
const leaflet = require('react-leaflet');
//custom files required
//data
const config = require('../data_components/config.json');
const layers = require('../data_components/layers.json');
//logic
const locationManager = require('../business_components/locationManager.js');
const logger = require('../business_components/logger.js');
const OfflineLayer = require('../business_components/offlineLayer.js');

class Map extends React.Component {

    constructor(props) {
        super(props);
        this.addLayers = this.addLayers.bind(this);
        this.renderMapWithLayers = this.renderMapWithLayers.bind(this);
        this.handleOverlayadd = this.handleOverlayadd.bind(this);
        this.handleOverlayremove = this.handleOverlayremove.bind(this);
        //get the settings from the config file
        this.state = {
            position: config.map.center,
            zoom: config.map.zoom,
            hasLocation: false
            // markerPosition: config.map.center  
            // markers: [[51.9692495, 7.596022]]
        }
        //marker symbol for the "you are here" marker
        this.positionMarker = L.icon({
            iconUrl: 'img/man.png',
            iconSize: [50, 50],
            iconAnchor: [25, 48],
            popupAnchor: [-3, -76]
        });
        //code added:Akhil - different icon for marker
        console.log('printing the koffer');
        this.tSpotMarker = L.icon({
            iconUrl: 'img/koffer.png',
            iconSize: [50, 50],
            iconAnchor: [25, 48],
            popupAnchor: [-3, -76]
        });

        var that = this;
        that.watchID = locationManager.watchLocation().then(function success(position) {
            var refs = {};
            if(that.props.gps) {
                that.setState({
                    position: [position.latitude, position.longitude],
                    // onChangeCurrPosition: ref => {
                    //     refs.marker = ref;
                    // },
                    onChangeZoomLevel: ref => {
                        refs.zoomLvl = ref;
                    }
                });
                that.setState({
                    markerPosition: refs.marker,
                    zoom: refs.zoomLvl.viewport.zoom
                });
            }
        }, function error(err) {
            console.log(err);
            console.log("error watching location");
        },
        { enableHighAccuracy: true, timeout: 250, maximumAge: 1000, distanceFilter: 1 },    // timeout: 20000
        );
    }

    /**
     * Insert the gps location of the user into the map, if the gps-setting is true.
     */
    componentDidMount() {
        var that = this;
        locationManager.getLocation().then(function success(position) {
            var pos = [];
            pos.push(position.latitude);
            pos.push(position.longitude);
            if(that.props.gps) {
                that.setState({
                    position: pos,
                    hasLocation: true
                });
            }
        })
    }

    componentWillUnmount() {
        navigator.geolocation.clearWatch(this.watchId);
    }

    updateZoomLvl() {
        var that = this;
        var refs = {};
        if(that.props.gps) {
            that.setState({
                onChangeZoomLevel: ref => {
                    refs.zoomLvl = ref;
                }
            });
        }
        if (that.state.zoomLvl != undefined) {
            that.setState({
                zoom: refs.zoomLvl
            });
        }
    }

    updateLocation() {
        var that = this;
        that.watchID = locationManager.watchLocation().then(function success(position) {
            var pos = [];
            pos.push(position.latitude);
            pos.push(position.longitude);

            var refs = {};
            if(that.props.gps) {
                that.setState({
                    position: pos,
                    onChangeZoomLevel: ref => {
                        refs.zoomLvl = ref;
                    }
                });
                if (that.state.zoomLvl != undefined) {
                    that.setState({
                        zoom: refs.zoomLvl
                    });
                }
                console.log(that.state);
            }
        }, function error(err) {
            console.log(err);
            console.log("error watching location");
        },
        { enableHighAccuracy: true, timeout: 250, maximumAge: 1000, distanceFilter: 1 },    // timeout: 20000
        );
    }

    /**
     * Write a log that notes the change of active layers
     * @param {boolean} change If the layer was added or removed
     * @param {String} data Name of the layer that was toggled
     */
    createLog(change, data) {
        var action;
        var that = this;
        if(this.props.logging) {
            //define the log
            if(change) {
                action =  'Activate ' + data;
            }
            else action = 'Deactivate ' + data;
            var entry;
            //get the current position for the log
            locationManager.getLocation().then(function success(position) {
                entry = [position.latitude, position.longitude, that.props.picture ? 'Streetview' : 'Map', action];
                //log the data
                logger.logEntry(entry);
            }, function error(err) {
                //if there was an error getting the position, log a '-' for lat/lng
                entry = ['-', '-', that.props.picture ? 'Streetview' : 'Map', action];
                //log the data
                logger.logEntry(entry);
            })
        }
    }

    /**
     * Handle the activation of a layer on the map
     * @param {Object} e Layer Object fired by leaflet
     */
    handleOverlayadd(e) {

        this.createLog(true, e.name);
    }

    /**
     * Handle the deactivation of a layer on the map
     * @param {Object} e Layer Object fired by leaflet
     */
    handleOverlayremove(e) {
        
        this.createLog(false, e.name);
    }

    //get the elements from the layer.json file and add each layer with a layercontrol.Overlay to the map
    addLayers() {
        var mapLayers = [];
        for (let layer in layers) {
            var layerElement = [];
            //check if the layer is containing markers and add those
            if (layers[layer].type == 'marker') {
                for (var i = 0; i < layers[layer].items.length; i++) {
                    //if there is a popup, insert it into the map
                    if(layers[layer].items[i].popup != undefined) {
                        layerElement.push(<leaflet.Marker position={layers[layer].items[i].coords} key={layers[layer].items[i].name}>
                            <leaflet.Popup>
                                <span>
                                    {layers[layer].items[i].popup}
                                </span>
                            </leaflet.Popup>
                            </leaflet.Marker>)
                    }
                    else {
                        layerElement.push(<leaflet.Marker position={layers[layer].items[i].coords} key={layers[layer].items[i].name} />)
                    }
                }
            }
            //Akhil:else it is a zone
            else if (layers[layer].type == 'zone'){
                for (var i = 0; i < layers[layer].items.length; i++) {
                    console.log('Printing the zonal circles');
                    layerElement.push(<leaflet.Circle center={layers[layer].items[i].center} color={layers[layer].items[i].color} radius={layers[layer].items[i].radius}
                                        key={layers[layer].items[i].name} />)
                }

            }
            //else it is a route
            else if (layers[layer].type == 'route') {
                layerElement.push(<leaflet.Polyline positions={layers[layer].coords} color='red' key={layers[layer].name} />);
            }
            mapLayers.push(<leaflet.LayersControl.Overlay key={layer} 
                                                        name={layer} 
                                                        checked={true}>
                                                        <leaflet.FeatureGroup key={layer}>
                                                            {layerElement}
                                                        </leaflet.FeatureGroup>
                            </leaflet.LayersControl.Overlay>)
        }
        return mapLayers;
    }

    renderMapWithLayers() {
        // check if the location is enabled and available
        const marker = this.state.hasLocation && this.props.gps
            ? (
                <leaflet.Marker position={this.state.position} icon={this.positionMarker} ref={this.state.onChangeCurrPosition} />
            )
            : null;
        return (
            <leaflet.Map
                center={this.state.position}
                zoom={this.state.zoom}
                dragging={this.props.draggable}
                zoomControl={this.props.zoomable}
                scrollWheelZoom={this.props.zoomable}
                zoomDelta={this.props.zoomable == false ? 0 : 1}
                onOverlayadd={this.handleOverlayadd}
                onOverlayremove={this.handleOverlayremove}
                ref={this.state.onChangeZoomLevel}>
                <OfflineLayer.OfflineLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="Map data &copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                />
                <leaflet.LayersControl position="topleft">
                    {this.addLayers()}
                </leaflet.LayersControl>
                <OfflineLayer.OfflineControl />
                {marker}
            </leaflet.Map>
        )
    }

    //render the map with the layerControl
    render() {
        this.componentDidMount();

        //if the layerControl is active, the map is rendered with the layercontrol
        if (this.props.layerControl) {
            return this.renderMapWithLayers()
        }
        else {
            // check if the location is enabled and available
            const marker = this.state.hasLocation && this.props.gps
                ? (
                    <leaflet.Marker position={this.state.position} icon={this.positionMarker} ref={this.state.onChangeCurrPosition} />
                )
                : null;
            //return the map without any layers shown
            return (
                <leaflet.Map 
                    center={this.state.position}
                    onClick={this.addMarker}
                    zoom={this.state.zoom}
                    dragging={this.props.draggable}
                    zoomControl={this.props.zoomable}
                    scrollWheelZoom={this.props.zoomable}
                    zoomDelta={this.props.zoomable == false ? 0 : 1}
                    ref={this.state.onChangeZoomLevel}>
                    <OfflineLayer.OfflineLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="Map data &copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                    />
                    <OfflineLayer.OfflineControl />
                    {this.state.markers.map((position, idx) => 
                        <leaflet.Marker key={`marker-${idx}`} position={position}>
                        <leaflet.Popup>
                            <span>A pretty CSS3 popup. <br/> Easily customizable.</span>
                        </leaflet.Popup>
                        </leaflet.Marker>
                        )}
                </leaflet.Map>
            )
        }
    }
}

module.exports = {
    Map: Map
}