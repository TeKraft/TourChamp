'use strict';
const React = require('react');
const Ons = require('react-onsenui');
const Button = require('react-bootstrap/lib/Button');
//custom files required
//data
const config = require('../data_components/config.json');
const layers = require('../data_components/layers.json');
const friendsJSON = require('../data_components/friend.json');
//logic
const logger = require('../business_components/logger.js');

class Game extends React.Component {
    constructor(props) {
        super(props);
        console.log(this.props);
        this.endGame = this.endGame.bind(this);
        this.closeGame = this.closeGame.bind(this);
        this.nextQuestion = this.nextQuestion.bind(this);
        this.selectSpot = this.selectSpot.bind(this);
        this.submitSpot = this.submitSpot.bind(this);
        this.submitAnswer = this.submitAnswer.bind(this);

        this.state = {
            circleRange: config.map.circleRange,
            value: this.props.defaultValue,
            gps: this.props.gps,
            spots: this.props.spots,
            selected: this.props.selected,
            scores: this.props.scores,
            oldScore: this.props.score,
            newScore: this.props.score,
            questionnaire: this.props.questionnaire,
            numberOfQuestions: this.props.numberOfQuestions,
            qset: null,
            selectedSpot: null,
            selectedAnswer: null
        };

    }

    componentDidMount() {
        var that = this;
        // do stuff here
    }

    /**
     * Function to close the Game component and return to the map without saving the score.
     */
    closeGame() {
        if (this.state.selectedSpot !== null) {
            let score = 0;
            if (this.state.scores[this.state.selectedSpot] !== undefined && this.state.scores[this.state.selectedSpot] > score) {
                score = this.state.scores[this.state.selectedSpot];
            }
            let scoreboard = {
                spot: this.state.selectedSpot,
                newScore: score,
                scores: this.state.scores
            };

            try {
                this.props.onEndGameChange(scoreboard);
                this.setState({selected: false});
            } catch(e) {
                console.log('Error:\n' + e);
            }
        } else {
            alert('Attention!\nPlease select a spot before closing the game.');
        }
    }

    /**
     * Function to close the Game component and return to the map with saving the score.
     */
    endGame() {
        let score = this.state.newScore;

        if (this.state.selectedSpot !== null) {
            if (this.state.scores[this.state.selectedSpot] !== undefined && this.state.scores[this.state.selectedSpot] > score) {
                score = this.state.scores[this.state.selectedSpot];
            }

            let scoreboard = {
                spot: this.state.selectedSpot,
                newScore: score,
                scores: this.state.scores
            };
            try {
                this.props.onEndGameChange(scoreboard);
                this.setState({selected: false});
            } catch(e) {
                console.log('Error:\n' + e);
            }
        }
    }

    /**
     * Function to set state of the spot that was selected by the user
     */
    selectSpot() {
        if (this.state.selectedSpot !== null) {
            let mySpot = this.state.selectedSpot;
            let spots = layers['T-spots'].items;
            let i = spots.findIndex((spot) => spot.name === mySpot);
            if (i >= 0) {
                this.state.qset = spots[i].qset;
                this.state.spotCoords = spots[i].coords;
                // TODO: check for score of selected spot
                this.setState({
                    selected: true
                });
            this.state.numberOfQuestions++;
            } else {
                alert('Attention!\nNo spot found.');
            }
        } else {
            alert('Attention!\nPlease select a spot.');
        }
    }

    /**
     * Function to update new metadata to question template
     */
    nextQuestion() {
        if (this.state.selectedAnswer !== null) {
            this.setState({
                selectedAnswer: null
            });
            this.state.numberOfQuestions++;
        } else {
            alert('Attention!\nPlease select an answer.');
        }

        if (this.state.qset === null || this.state.numberOfQuestions === this.state.qset.length) {
            this.setState({
                questionnaire: false
            })
        }
    }

    /**
     * Function to create a button for a spot.
     * @param {String} spot name of the spot 
     */
    makeSpotButton(spot) {
        return (
            <Button bsSize='large' key={spot} value={spot} onClick={() => this.submitSpot(spot)} block>{spot}</Button>
        )
    }

    /**
     * Function to create buttons of the answers.
     * Differentiate when clicked between warning (orange) and success (green)
     * @param {Object} item object of a single answer [letter, value] 
     */
    makeAnswerButton(item) {
        let answer = Object.entries(item)[0];
        let buttonStyle = 'default';

        if (this.state.selectedAnswer !== null ) {
            if (answer[0] === this.state.selectedAnswer[0]) {
                buttonStyle = 'warning';
            }
            if (answer[0] === this.state.qset[this.state.numberOfQuestions-1].Answer) {
                buttonStyle = 'success';
            }
        }

        return (
            <Button bsSize='large' bsStyle={buttonStyle} ref={answer[0]} key={answer[0]} value={answer[1]} onClick={(event) => this.submitAnswer(answer, event)} block>{answer[1]}</Button>
        )
    }

    /**
     * Function to check weather a friend is also in range of the spot,
     * to add a point for each friend in range.
     */
    checkForFriends() {
        let friends = friendsJSON['friends'];
        let add = 0;
        for (let friend in friends) {
            if (friends[friend].showme) {
                if (this.friendInRange(this.state.spotCoords, friends[friend].location)) {
                    console.log('in range: ' + friends[friend].name);
                    add += 1;
                }
            }
        }
        return add;
    }
    
    /**
     * Function to return true, if a friend is also in range of a spot.
     * @param {Array} spot lat, lon of location of the spot
     * @param {Array} location lat, lon of location of a friend 
     */
    friendInRange(spot, location) {
        let dist = this.calcDistance(spot, location);
        return (dist <= this.state.circleRange ? true : false);
    }

    /**
     * Calculate the distance in km of two provided points.
     * @param {Array} latlng1 first point - [latitude, longitude]
     * @param {Array} latlng2 second point - [latitude, longitude]
     */
    calcDistance(latlng1, latlng2) {
        // Deg --> Rad
        var lat1 = latlng1[0]*Math.PI/180;
        var lat2 = latlng2[0]*Math.PI/180;
        var lng1 = latlng1[1]*Math.PI/180;
        var lng2 = latlng2[1]*Math.PI/180;
        // distance calculation:
        var cosG = Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
        var dist = 6378.388 * Math.acos(cosG);
        return dist;
    };

    /**
     * Function to add selected spot to state without re-rendering.
     * @param {String} spot name of selected spot 
     */
    submitSpot(spot) {
        this.state.selectedSpot = spot;
    }

    /**
     * Function to add points to the score, when the question is submitted.
     * Setting the state leads to re-rendering the Prompt to go to next question.
     * @param {Array} answer array containing letter and value of answer
     */
    submitAnswer(answer, event) {
        if (this.state.selectedAnswer === null) {
            // this.state.selectedAnswer = answer;
            let points = 0;
            if (answer[0] === this.state.qset[this.state.numberOfQuestions - 1].Answer) {
                if (this.props.gpsForFriends) {
                    points = 5 + this.checkForFriends();
                } else {
                    points = 5;
               }
            }
            let newScore = this.state.newScore + points;
            this.setState({
                selectedAnswer: answer,
                newScore: newScore
            });
        }
    }

    render() {
        if (this.state.selected === false) {
            // render if component is first time loaded and user has to select a spot
            var listOfSpots = this.state.spots.map(this.makeSpotButton, this);
            return (
                <div>
                    <div>
                        <h1 align='center'>Select Spot</h1>
                        <div>
                            {listOfSpots}
                        </div>
                    </div>
                    <div>
                        <ons-button onClick={this.closeGame} style={{float: 'left'}}>Abort</ons-button>
                        <ons-button onClick={this.selectSpot} style={{float: 'right'}}>Submit</ons-button>
                    </div>
                </div>
            )
        } else if (this.state.questionnaire === true) {
            if (this.state.qset[0].Options !== undefined) {
                // render to show questions
                if (this.state.selectedQuestionAnswer) {
                    var listOfAnswers = this.state.qset[this.state.numberOfQuestions - 1].Options.map(this.makeAnswerButton, this);
                } else {
                    var listOfAnswers = this.state.qset[this.state.numberOfQuestions - 1].Options.map(this.makeAnswerButton, this);
                }
                return (
                    <div>
                        <h1 align='center'>Question {this.state.numberOfQuestions}</h1>
                        <div>
                            <h2>{this.state.qset[this.state.numberOfQuestions - 1].Question}</h2>
                            {listOfAnswers}
                        </div>
                        <div>
                            <ons-button onClick={this.closeGame} style={{float: 'left'}}>Abort</ons-button>
                            <ons-button onClick={this.nextQuestion} style={{float: 'right'}}>Next</ons-button>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div>
                        <h1 align='center'>Attention!</h1>
                        <p align='center'>No questions for this spot are provided.</p>
                        <div>
                            <ons-button modifier='large' style={{float: 'center'}} onClick={this.endGame}>Close</ons-button>
                        </div>
                    </div>
                )
            }
        } else {
            // render to show scoreboard at the end of the questionnaire
            let highscore = this.state.newScore;
            if (this.state.scores[this.state.selectedSpot] !== undefined && this.state.scores[this.state.selectedSpot] > highscore) {
                highscore = this.state.scores[this.state.selectedSpot];
            }
            return (
                <div>
                    <h1 align='center'>Scoreboard</h1>
                    <div>
                        <p align='center'>You received {this.state.newScore - this.state.oldScore} points.</p>
                        <p align='center'>Your highscore for this spot is: {highscore}.</p>
                    </div>
                    <div>
                        <ons-button onClick={this.endGame} style={{float: 'center'}} modifier='large'>Finish</ons-button>
                    </div>
                </div>
            )
        }
    }
}

module.exports = {
    Game: Game
}