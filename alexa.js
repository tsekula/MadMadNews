'use strict';
var Alexa = require("alexa-sdk");
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    //alexa.dynamoDBTableName = 'highLowGuessUsers';
    alexa.registerHandlers(newSessionHandlers, guessModeHandlers, startGameHandlers, guessAttemptHandlers);
    alexa.execute();
};

var states = {
    PICKCATEGORYMODE: '_PICKCATEGORYMODE', // User is choosing a category for the story.
    SUPPLYWORDSMODE: '_SUPPLYWORDSMODE', // User is providing words for the story.
    STORYTELLMODE: '_STORYTELLMODE', // The story has been assembled.
    STARTMODE: '_STARTMODE'  // Prompt the user to start a new story.
};

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['endedSessionCount'] = 0;
            this.attributes['gamesPlayed'] = 0;
        }
        this.handler.state = states.PICKCATEGORYMODE;
        this.emit(':ask', 'Let\'s get you a mad mad news update.  Do you want the latest US news, world news, or surprise you with something else?');
    },
    "AMAZON.StopIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        //this.attributes['endedSessionCount'] += 1;
        this.emit(":tell", "Goodbye!");
    }
};

var startGameHandlers = Alexa.CreateStateHandler(states.PICKCATEGORYMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'PickCategoryIntent': function() {
        console.log("PickCategoryIntent")
        // sets chosen category
        var chosenCategory = this.event.request.intent.slots.category.value;
        this.attributes["chosenCategory"] = chosenCategory;
        console.log('user chose: ' + chosenCategory);

        // for the chosen category, 
        //  grab some articles, extract all the replacement markers,
        //  load them into attributes


    },
    'AMAZON.HelpIntent': function() {
        var message = 'I will think of a number between zero and one hundred, try to guess and I will tell you if it' +
            ' is higher or lower. Do you want to start the game?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        this.attributes["guessNumber"] = Math.floor(Math.random() * 100);
        this.handler.state = states.GUESSMODE;
        this.emit(':ask', 'Great! ' + 'Try saying a number to start the game.', 'Try saying a number.');
    },
    'AMAZON.NoIntent': function() {
        console.log("NOINTENT");
        this.emit(':tell', 'Ok, see you next time!');
    },
    "AMAZON.StopIntent": function() {
      console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
      console.log("CANCELINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        //this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        var message = 'Say yes to continue, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'NumberGuessIntent': function() {
        var guessNum = parseInt(this.event.request.intent.slots.number.value);
        var targetNum = this.attributes["guessNumber"];
        console.log('user guessed: ' + guessNum);

        if(guessNum > targetNum){
            this.emit('TooHigh', guessNum);
        } else if( guessNum < targetNum){
            this.emit('TooLow', guessNum);
        } else if (guessNum === targetNum){
            // With a callback, use the arrow function to preserve the correct 'this' context
            this.emit('JustRight', () => {
                this.emit(':ask', guessNum.toString() + 'is correct! Would you like to play a new game?',
                'Say yes to start a new game, or no to end the game.');
        })
        } else {
            this.emit('NotANum');
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I am thinking of a number between zero and one hundred, try to guess and I will tell you' +
            ' if it is higher or lower.', 'Try saying a number.');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
      this.emit(':tell', "Goodbye!");  
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.attributes['endedSessionCount'] += 1;
        this.emit(':tell', "Goodbye!");
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
});

// These handlers are not bound to a state
var guessAttemptHandlers = {
    'TooHigh': function(val) {
        this.emit(':ask', val.toString() + ' is too high.', 'Try saying a smaller number.');
    },
    'TooLow': function(val) {
        this.emit(':ask', val.toString() + ' is too low.', 'Try saying a larger number.');
    },
    'JustRight': function(callback) {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        callback();
    },
    'NotANum': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Try saying a number.', 'Try saying a number.');
    }
};