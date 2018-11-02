/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

const numberOfWordsToAskFor = 6;
const storyfunctions = require('./storyfunctions.js');
const utils = require('./utils.js');

const VOICE_START = '<voice name="Brian"><lang xml:lang="en-GB">';
const VOICE_END = '</lang></voice>';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
   handle(handlerInput) {
    const speechText = 'Welcome to "Mad Mad News".<audio src="soundbank://soundlibrary/human/amzn_sfx_laughter_giggle_02"/>  You can say "make random news" or "make my own news".';
    const promptText = 'You can say "make random news" or "make my own news".';

    const attributesManager = handlerInput.attributesManager;

    const attributes = attributesManager.getSessionAttributes() || {};
    if (Object.keys(attributes).length === 0) {
      attributes.endedSessionCount = 0;
      attributes.newsMade = 0;
      attributes.storyState = 'START';
    }

    attributesManager.setSessionAttributes(attributes);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .withSimpleCard('Welcome to Mad Mad News', speechText)
      .getResponse();
  }
};

const MakeRandomMadNewsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MakeRandomMadNewsIntent';
  },
  handle(handlerInput) {
    const speechText = `Ok, I\'ll cook up some random crazy news.`;
    const promptText = 'First, which word should I use for the noun?  Say, "use", and then a noun.';

    // set to NYT World Stories as source per headline-sources.json
    const sourceIndex=0;
    // get a random headline
    const story = storyfunctions.getRandomStory(sourceIndex);
    var replacetags = [3,5,6,9, 12, 15,16];
    var readme = storyfunctions.getAlexaStoryFormattedForReading(story, replacetags);
    console.log(readme);

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .getResponse();
  },
};

const MakeOwnMadNewsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'MakeOwnMadNewsIntent';
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    let userWords = [];
    sessionAttributes.storyState = 'MAKEOWN';
    sessionAttributes.userWords = userWords;

    // set to NYT World Stories as source per headline-sources.json
    const sourceIndex=0;
    
    // fake random choice
    // get a random headline
    let storyIndex = storyfunctions.getRandomStoryIndex(sourceIndex);
    let storySource = storyfunctions.getStory(sourceIndex, storyIndex);
    let replacetags = [3,5,6,9, 12, 15,16];
    //let readme = storyfunctions.getAlexaStoryFormattedForReading(story, replacetags);
    
    sessionAttributes.storyIndex = storyIndex;
    sessionAttributes.storyReplaceTags = replacetags;
    const mynumbertoaskfor = replacetags.length;

    const thistag = storySource.headlineentitytags[replacetags[0]][1];
    const thistagdata = storyfunctions.getEntityTagInfo(thistag);
    const thistagfullname = thistagdata.fullname;

    const speechText = `Ok, I\'ll cook up some crazy news.  I\'ll need ${mynumbertoaskfor} words. Let's go!  What should I use for the first word?  Say, "use", and then ${thistagfullname}.`;
    const promptText = 'First, which word should I use for the noun?  Say, "use", and then a noun.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .getResponse();
  },
};

const GiveWordIntentHandler = {
  canHandle(handlerInput) {
    // only start a new game if yes is said when not playing a game.
    let isCurrentlyMaking = false;
    const request = handlerInput.requestEnvelope.request;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.storyState &&
        sessionAttributes.storyState === 'MAKEOWN') {
      isCurrentlyMaking = true;
    }

    return isCurrentlyMaking && request.type === 'IntentRequest' && request.intent.name === 'GiveWordIntent';
  },
  handle(handlerInput) {
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const word = slots['word'].value;

    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const storyIndex = sessionAttributes.storyIndex;
    const replacetags = sessionAttributes.storyReplaceTags;

    let userWords = [];
    let index = 0;
    if (sessionAttributes.userWords && sessionAttributes.userWords.length > 0) {
      userWords = sessionAttributes.userWords;
      index = sessionAttributes.userWords.length;
    }

    // add new word to the list
    userWords[index] = word;
    sessionAttributes.userWords = userWords;

    let speechText = "";
    let promptText = "";
    const sourceIndex = 0;
    let storySource = storyfunctions.getStory(sourceIndex, storyIndex);
    
    // if we don't need more words, finally output the story
    if (userWords.length == replacetags.length) {
      let readme = storyfunctions.getAlexaStoryFormattedForReading(storySource, replacetags);
      const completestory = storyfunctions.getAlexaFinalStory(readme, replacetags, userWords);
      speechText = `Ok, and now your story.<audio src='soundbank://soundlibrary/human/amzn_sfx_clear_throat_ahem_01'/>  ${VOICE_START}From New York Times World News. ${completestory}${VOICE_END}`;
      promptText = '';
      
    } else {      // else prompt for another word
      const thistag = storySource.headlineentitytags[replacetags[index+1]][1];
      const thistagdata = storyfunctions.getEntityTagInfo(thistag);
      const thistagfullname = thistagdata.fullname;

      speechText = `<audio src='soundbank://soundlibrary/office/amzn_sfx_typing_short_02'/>Got it.  Now give me ${thistagfullname} to use.`;
      promptText = `Give me ${thistagfullname}.`;
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let isCurrentlyMaking = false;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    let helptopic = "";
    let speechText="", promptText="";
    
    if (slots && slots['topic'])
      helptopic = slots['topic'].value;

    if (sessionAttributes.storyState &&
        sessionAttributes.storyState === 'MAKEOWN') {
      isCurrentlyMaking = true;
    }

    if (isCurrentlyMaking) {    // needs help while making the story
      const sourceIndex = 0;
      const storyIndex = sessionAttributes.storyIndex;
      const storySource = storyfunctions.getStory(sourceIndex, storyIndex);
      const replacetags = sessionAttributes.storyReplaceTags;

      let userWords = [];
      if (sessionAttributes.userWords && sessionAttributes.userWords.length > 0) {
        userWords = sessionAttributes.userWords;
      }

      const thistag = storySource.headlineentitytags[replacetags[userWords.length]][1];
      const thistagdata = storyfunctions.getEntityTagInfo(thistag);
      const thistagfullname = thistagdata.fullname;
      const thistagdescription = thistagdata.description;
      const thistagexamples = thistagdata.examples;
 

      speechText = `I'm looking for ${thistagfullname}, which is ${thistagdescription}. Some examples are: ${thistagexamples}. <break time="1s"/>Say, "use", and then ${thistagfullname}.`;
      promptText = `Give me ${thistagfullname}.`;
    } else{
      speechText = 'You can say hello to me!';
      
    }


    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(promptText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log('Session ended with reason: ${handlerInput.requestEnvelope.request.reason}');

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('Error handled: ${error.message}');

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    MakeRandomMadNewsIntentHandler,
    MakeOwnMadNewsIntentHandler,
    GiveWordIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();