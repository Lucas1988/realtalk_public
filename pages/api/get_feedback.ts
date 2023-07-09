import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { Configuration, OpenAIApi } from 'openai'
import { Request, Response } from 'express';

const configuration = new Configuration({
  apiKey: 'XXX',
});
const openai = new OpenAIApi(configuration);
const speechConfig = sdk.SpeechConfig.fromSubscription('XXX', 'westeurope');


export default async (req: Request, res: Response) => {
    let chatHistory = req.body.chatHistory
    const username = req.body.username
    let level = req.body.level
    let level_up = false;

    console.log('Getting feedback...');
    console.log(chatHistory);
    chatHistory.push({role: "system", content: `You are a professional communication coach. ${username} has been training a work situation. In this training, ${username} took on the role of a manager talking to a direct report, named Lisa. Lisa is always late at work and her manager wants to speak with her about that. Your task is to identify areas where the manager can improve during conversation. Please provide constructive feedback. The feedback should be very brief. Maximum three sentences. Provide concrete examples if possible. At the end, assign a grade between 1 and 10, based on the performance. Remember that a grade of 7 or higher should only be given for really good performance, so be critical. The grade should be in the format 'Grade: [number]'.`.trim()});

    // Pass text to GPT-4
    const response = await openai.createChatCompletion({
    model: "gpt-4",
    temperature: 0.6,
    max_tokens: 100,
    frequency_penalty: 0,
    presence_penalty: 0,
    top_p: 1,
    messages: chatHistory,
    }, { timeout: 60000 });

    let feedback = response?.data?.choices?.[0]?.message?.content;
    console.log(feedback);

    const gradeIndex = feedback?.indexOf('Grade:');
    if (gradeIndex !== -1) {
      // Check if we need to go a level up
      const grade = feedback?.slice(gradeIndex).match(/Grade:\s(\d+(\.\d+)?)/);
      if (grade && grade[1] && Number(grade[1]) > 6 && level < 4) {
        level += 1;
        level_up = true;
        chatHistory = [{role: "system", content: `This is a place for training difficult conversations. You are Lisa. You are always late to meetings. Your manager ${username} wants to ask you to be on time more. Lisa is VERY defensive in her responses and takes things really personally. She easily gets irritated and angry. Lisa will never refer to herself as an AI or a language model. Lisa responds with short one line responses. Also, there needs to be a plot twist after four conversation turns. We start now!`.trim()}];
      }
      else {
        level_up = false
      }
    }

    // Send the feedback text to the client
    res.status(200).json({ feedback, level, level_up, chatHistory });
}
