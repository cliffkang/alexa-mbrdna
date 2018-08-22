import axios from 'axios';
const Alexa = require('ask-sdk-core');

import { CLIENT_ID } from './config';
import { CLIENT_SECRET } from './config';
import { VEHICLE_ID } from './config';

const ROOT_URL = `https://api.mercedes-benz.com/experimental/connectedvehicle/v1/vehicles/${VEHICLE_ID}`;
let ACCESS_TOKEN = null;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to your Mercedes!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    },
};

const StatusIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'StatusIntent';
    },
    handle(handlerInput) {
        let modelName;
        // gas & electric mile capacity of car
        let gasMiles = 400;
        let electricMiles = 320;
        if (ACCESS_TOKEN !== null) {
            const headers = {
                authorization: `Bearer ${ACCESS_TOKEN}`,
                accept: 'application/json',
            }
            // get vehicle info for vehicle's model name
            axios.get(`${ROOT_URL}`, { headers })
                .then(vehicle => {
                    modelName = vehicle.salesdesignation;
                    // get fuel info -> use % to convert to number of miles left
                    axios.get(`${ROOT_URL}/fuel`, { headers })
                        .then(fuel => {
                            gasMiles = gasMiles * 100 / fuel.fuellevelpercent.value;
                            // get charge info -> use % to convert to number of miles left
                            axios.get(`${ROOT_URL}/stateofcharge`, { headers })
                                .then(charge => {
                                    electricMiles = electricMiles * 100 / charge.stateofcharge.value;
                                    const speechText = `Your ${modelName} has about ${gasMiles} miles of gas left 
                                        and ${electricMiles} miles of electric power left!`;
                                    // return what Alexa will say
                                    return handlerInput.responseBuilder
                                        .speak(speechText)
                                        .withSimpleCard('Hello World', speechText)
                                        .getResponse();
                                })
                                .catch(err => console.log(`error getting vehicle charge info: ${err}`))
                        })
                        .catch(err => console.log(`error getting vehicle fuel info: ${err}`))
                })
                .catch(err => console.log(`error getting vehicle info: ${err}`))
        } else {
            const speechText = `Your unknown vehicle has a mysterious amount of miles of gas left 
                and a fleeting number of miles of electric power left!`;
            // return what Alexa will say
            return handlerInput.responseBuilder
                .speak(speechText)
                .withSimpleCard('Hello World', speechText)
                .getResponse();
        }
    },
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speechText = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

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
        HelloWorldIntentHandler,
        StatusIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
