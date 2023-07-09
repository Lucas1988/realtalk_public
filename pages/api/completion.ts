import type { NextApiRequest, NextApiResponse } from 'next'
import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: 'XXX',
});
export const openai = new OpenAIApi(configuration);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const chatHistory = req.body.chatHistory;

  const response = await openai.createChatCompletion({
    //model: "gpt-3.5-turbo",
    model: "gpt-4",
    temperature: 0.9,
    max_tokens: 100,
    frequency_penalty: 0,
    presence_penalty: 0,
    top_p: 1,
    messages: chatHistory,
  }, { timeout: 60000 });

  let response_string = response?.data?.choices?.[0]?.message?.content;
  console.log(response_string)

  res.status(200).json({ response_string })

}
