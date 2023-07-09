import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Configuration, OpenAIApi } from 'openai'
import ConfettiGenerator from 'confetti-js';

const configuration = new Configuration({
  apiKey: 'XXX',
});
const openai = new OpenAIApi(configuration);
let level = 1;
let giving_feedback = false;
let scenario = 'job-interview'
let username = '';
let chatHistory: { role: string, content: string }[] = [];
let onProgress = ({turn: 'ai'})
let intervalId: NodeJS.Timeout;
let initialGreetingGiven = false;

// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
const speechConfig = sdk.SpeechConfig.fromSubscription('XXX', 'XXX');
speechConfig.speechRecognitionLanguage = "en-US";

// @ts-ignore
async function main(onProgress) {

    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    let audioConfig = sdk.AudioConfig.fromStreamInput(stream);
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    let character_name = 'Lisa';
    let conversation_turn = 1;
    let welcome_text = `Hey ${username}! Welcome to realTalk. I’m here to help you have more effective conversations at work. Let’s start with a simple exercise. Imagine someone on your team, called Lisa, is always late to meetings. You want to ask her to be on time more. When you are ready, you can start the conversation. After two minutes, or if you say “exit”, the conversation ends, and I will give you feedback and suggestions. If you're ready to start, say 'Start'!`
    // let welcome_text = `Hi!`

    // Change image to coach
    let imageElement = document.getElementById('avatar');
    if (imageElement) {
        imageElement.setAttribute('src', './coach.png');
    }

    // Change name to coach
    let nameElement = document.getElementById('name-id');
    if (nameElement) {
        nameElement.innerText = 'Coach';
    }

    // The coach gives an introduction before the actual training starts
    const audioConfigOut = sdk.AudioConfig.fromSpeakerOutput();
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfigOut);
    let ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
            <voice name="en-GB-SoniaNeural">
                <mstts:express-as style="happy">
                    ${welcome_text}
                </mstts:express-as>
            </voice>
        </speak>
    `.trim();

    await new Promise<void>(resolve => {
        synthesizer.speakSsmlAsync(ssml, async result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                // @ts-ignore
                await new Promise<void>(resolve => setTimeout(resolve, result.privAudioDuration / 10000));
                resolve();
            }
        });
    });
    synthesizer.close();
    console.log('audio done');

    let input_text = '';
    // Wait for 'start' command
    while (input_text.toLowerCase().trim() !== 'start.' && input_text.toLowerCase().trim() !== 'yes.') {
        const result = await new Promise(resolve => {
            speechRecognizer.recognizeOnceAsync(resolve);
        })
        // @ts-ignore
        if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
            console.log('No speech input received');
            continue;
        }
        // @ts-ignore
        input_text = result.text.trim();
        console.log(`Input:`, input_text);
        if (input_text.toLowerCase() !== 'start.') {
            console.log("Waiting for 'start' command");
            // The coach gives an introduction before the actual training starts
            const audioConfigOut = sdk.AudioConfig.fromSpeakerOutput();
            const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfigOut);
            ssml = `
                <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
                    <voice name="en-GB-SoniaNeural">
                        <mstts:express-as style="happy">
                            I didn’t quite catch that. Are you ready to start?
                        </mstts:express-as>
                    </voice>
                </speak>
            `.trim();

            await new Promise<void>(resolve => {
                synthesizer.speakSsmlAsync(ssml, async result => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        // @ts-ignore
                        await new Promise<void>(resolve => setTimeout(resolve, result.privAudioDuration / 10000));
                        resolve();
                    }
                });
            });
            synthesizer.close();
        }
    }

    giving_feedback = false;

    // Start sound is played
    const startSound = new Audio('start-sound.mp3');
    await startSound.play();
    onProgress({turn: 'ai'})

    // @ts-ignore
    if (imageElement) {
        imageElement.setAttribute('src', './lisa.png');
    }

    // Change name back to Lisa after coach has finished speaking
    if (nameElement) {
        nameElement.innerText = 'Lisa';
    }


    if (level == 1) {
        scenario = 'always_late'
        chatHistory = [{role: "system", content: `This is a place for training difficult conversations. You are Lisa. You are always late to meetings. Your manager ${username} wants to ask you to be on time more. Lisa uses common human responses, like denial, getting emotional, resistance, or emotional disengagement. Lisa will never refer to herself as an AI or a language model. She behaves as a human employee, not as an assistant. Lisa responds with short one line responses. Also, there needs to be a plot twist after four conversation turns. We start now!`.trim()}];
    }

    while (true) {
        let completion_text = ""
        let completion_emotion = ""
        let completion_name = ""
        let voice = ""
        let input_text = ""

        console.log(scenario)

        onProgress({turn: 'user'})

        if (!initialGreetingGiven) {
            initialGreetingGiven = true;
            input_text = "Hi Lisa.";
        } else {
        const result = await new Promise(resolve => {
            speechRecognizer.recognizeOnceAsync(resolve);
        })
        // @ts-ignore
        if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
            console.log('no speech input received')
            continue
        }
        // @ts-ignore
        input_text = result.text
        }

        console.log('input:', input_text);

        if(input_text != ''){
            chatHistory.push({role: "user", content: input_text});
        }

        if (input_text.toLowerCase().trim() == 'open menu.') {
            // Remove items from local storage
            window.localStorage.removeItem('scenario');
            window.localStorage.removeItem('level');
            window.localStorage.removeItem('chatHistory');

            // Redirect to index.html
            window.location.href = 'index.html';
        }
        if (input_text.toLowerCase().trim() == 'exit.') {
            getFeedback();
        }

        onProgress({turn: 'ai_thinking'});

        // Pass text to GPT-3
        const response = await fetch('/api/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatHistory
            })
        })

        const data = await response.json();
        completion_text = data.response_string;

        try {
            // @ts-ignore
            if (level == 1) {
                completion_emotion = "gentle";
            }
            if (level == 2) {
                completion_emotion = "unfriendly";
            }
            completion_name = "Lisa";
        } catch(e){
            console.log('Something went wrong:', e);
            continue;
        }

        // Lisa's voice
        voice = 'en-US-SaraNeural';

        chatHistory.push({role: "assistant", content: completion_text});
        console.log("Lisa: ", completion_text);

        onProgress({turn: 'ai'})
        const audioConfigOut = sdk.AudioConfig.fromSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfigOut);
        ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
                <voice name="${voice}">
                    <mstts:express-as style="${completion_emotion}">
                        ${completion_text}
                    </mstts:express-as>
                </voice>
            </speak>
        `.trim();

        if (!giving_feedback) {
            await new Promise(resolve => {
                synthesizer.speakSsmlAsync(ssml, async result => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        // @ts-ignore
                        await new Promise(resolve => setTimeout(resolve, result.privAudioDuration / 10000));
                        // @ts-ignore
                        resolve();
                    }
                });
            });
            synthesizer.close();
        }

        console.log('audio done');
        conversation_turn += 1;
    }
}

// Give feedback after x seconds
intervalId = setInterval(() => getFeedback(), 120000);

function getFeedback() {
    giving_feedback = true;
    // Start sound is played
    let startSound: HTMLAudioElement = new Audio('start-sound.mp3');
    startSound.play();

    // Change image here to coach
    let imageElement = document.getElementById('avatar');
    if (imageElement) {
        imageElement.setAttribute('src', './coach.png');
    }

    // Change name here to Coach
    let nameElement = document.getElementById('name-id');
    if (nameElement) {
        nameElement.innerText = 'Coach';
    }

    fetch('/api/get_feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatHistory: chatHistory, level: level, username: username }),
    })
    .then(response => response.json())
    .then(async data => { // make this function async so we can await inside it
        console.log(data.feedback);  // log the received feedback
        level = data.level;
        if (level === 1) {
            data.feedback = `${data.feedback}. You did not manage to go a level up, but you can try again now! Good luck.`.trim();
        }
        if (level === 2) {
            data.feedback = `${data.feedback}. You are now at level 2. In a slightly harder exercise, Lisa is not really open to your feedback and becomes defensive. You will switch back to Lisa now. Good luck.`.trim();
        }
        if (level === 3) {
            data.feedback = `${data.feedback}. You have now completed this training. Congratulations! Thank you for trying realTalk. We are creating many types of conversations and many types of personalities and responses for you to train with. Sign up today to learn more and start having better conversations. You are now returning to the realTalk homepage.`.trim();
        }
        let level_up = data.level_up;
        chatHistory = data.chatHistory;

        // Set a new interval
        clearInterval(intervalId);
        intervalId = setInterval(() => getFeedback(), 120000);

        // Create and configure the synthesizer
        const audioConfigOut = sdk.AudioConfig.fromSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfigOut);
        let ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
                <voice name="en-GB-SoniaNeural">
                    <mstts:express-as style="happy">
                        ${data.feedback}
                    </mstts:express-as>
                </voice>
            </speak>
        `.trim();

        await new Promise<void>(resolve => {
            synthesizer.speakSsmlAsync(ssml, async result => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    // @ts-ignore
                    await new Promise<void>(resolve => setTimeout(resolve, result.privAudioDuration / 10000));
                    // @ts-ignore
                    if (imageElement) {
                        imageElement.setAttribute('src', './lisa.png');
                    }
                    // Change name back to Lisa after coach has finished speaking
                    if (nameElement) {
                        nameElement.innerText = 'Lisa';
                    }
                    resolve();
                }
            });
        });
        synthesizer.close();
        giving_feedback = false;
        console.log('audio done');

        if (level === 3) {
            window.location.href = "https://www.get-real-talk.com/";
        }

        if (level_up === true) {
            showConfetti();
        }
        else {
            // Start sound is played
            let startSound: HTMLAudioElement = new Audio('start-sound.mp3');
            startSound.play();
        }

        // Set a new interval
        clearInterval(intervalId);
        intervalId = setInterval(() => getFeedback(), 120000);
        initialGreetingGiven = false;


    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


// retrieve the username from localStorage
username = window.localStorage.getItem('username') as string;

if (username !== null) {

  // then run your main function
  interface IData {
    turn: string;
    // Add other properties if needed
  }

  main((data: IData) => {
    document.querySelectorAll(`.user .active-outline, .user .active-logo`)
      .forEach(node => (node as HTMLElement).style.display = data.turn === "user" ? "block" : "none");
    document.querySelectorAll(`.ai-user .active-outline, .ai-user .active-logo`)
      .forEach(node => (node as HTMLElement).style.display = data.turn === "ai" ? "block" : "none");
  });
} else {
  console.error("Username not set");
}

function showConfetti() {
    // Play festive trumpet sound
    const audio = new Audio('success-trumpets.mp3');
    audio.play();

    // Render confetti animation
    const confettiSettings = { target: 'show_confetti' };
    const confetti = new ConfettiGenerator(confettiSettings);
    confetti.render();

    setTimeout(() => {
        confetti.clear();
    }, 3000); // Clear after 3 seconds
}
