# RealTalk web demo

This is the UI for the RealTalk project demo.

`public/index.html` contains the demo start screen, and `public/index2.html` contains the actual calling screen. `public/frontend.ts` contains the TypeScript speech recognition + response generation + TTS code, while `pages/api/completion.ts` and `pages/api/get_feedback.ts` contain the GPT-4 API calls.

In development, run `npm install` to install the dependencies. Then run `npm run dev` and `npx parcel build && cp dist/* public` every time you make a code change. 

To deploy the site, create a free vercel.com account and select a fork of this repo. Everything should be configured already.

For more information on this project, see https://www.get-real-talk.com/
