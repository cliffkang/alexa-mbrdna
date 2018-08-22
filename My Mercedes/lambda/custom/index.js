import axios from 'axios';
const Alexa = require('ask-sdk-core');

import { CLIENT_ID } from './config';
import { CLIENT_SECRET } from './config';

const VEHICLE_ID = '31E2D80C7B24F9B98A';

const ROOT_URL_TRY = `https://api.mercedes-benz.com/experimental/connectedvehicle_tryout/v1/vehicles/${VEHICLE_ID}`;
const ROOT_URL = `https://api.mercedes-benz.com/experimental/connectedvehicle/v1/vehicles/${VEHICLE_ID}`;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speechText = 'Welcome to your Mercedes!';
        const { accessToken } = handlerInput.requestEnvelope.context.System.user;
        if (accessToken === undefined) {
            speechText = 'Welcome to Mercedes. Please link up your account so we can retrieve your car\'s information.';
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .withLinkAccountCard()
                .getResponse();
        }

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
        const { accessToken } = handlerInput.requestEnvelope.context.System.user;
        let modelName;
        // gas & electric mile capacity of car
        let gasMiles = 400;
        let electricMiles = 320;
        let speechText = '';
        if (accessToken !== undefined) {
            const headers = {
                authorization: `Bearer ${accessToken}`,
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
                                    speechText = `Your ${modelName} has about ${gasMiles} miles of gas left 
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
            speechText = `Your unknown vehicle has a mysterious amount of miles of gas left 
                and a fleeting number of miles of electric power left! So please do link your account.`;
            return handlerInput.responseBuilder
                .speak(speechText)
                .withLinkAccountCard()
                .getResponse();
        }
    },
};

const LockDoorIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'LockDoorIntent';
    },
    handle(handlerInput) {
        const { accessToken } = handlerInput.requestEnvelope.context.System.user;
        let speechText = 'that was a good attempt at locking your doors. but first, let\'s link up your account!';
        const headers = {
            authorization: `Bearer ${accessToken}`,
            accept: 'application/json',
        }
        if (accessToken !== undefined) {
            axios.get(`${ROOT_URL}/doors`, { headers })
                .then(doorState => {
                    if (doorState.doorlockstatusvehicle === 'UNLOCKED') {
                        const data = { command: 'LOCK' };
                        axios.post(`${ROOT_URL}/doors`, { headers, data })
                            .then(res => {
                                if (res.status === 'INITIATED') speechText = 'doors locking';
                                else speechText = 'error locking doors';
                                return handlerInput.responseBuilder
                                    .speak(speechText)
                                    .withSimpleCard('Hello World', speechText)
                                    .getResponse();
                            })
                            .catch(err => console.log(`error posting lock command: ${err}`))
                    } else speechText = 'doors already locked';
                })
                .catch(err => console.log(`error getting door status: ${err}`))
        } else {
            return handlerInput.responseBuilder
                .speak(speechText)
                .withLinkAccountCard()
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
        LockDoorIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
