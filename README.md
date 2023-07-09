# HERE AI web prototype

This is the Google Meet UI for the Amsterdam AI Hackathon 2023 project HERE AI.

The code is very messy. `public/index.html` contains the copied UI and most of the style changes. `public/frontend.ts` contains the JavaScript speech recognition + response generation + TTS, while `pages/api/completion.ts` contains the GPT-3 prompt.

In development, run `npm install` to install the dependencies. Then run `npm run dev` and `npx parcel build && cp dist/* public` every time you make a code change. 

To deploy the site, create a free vercel.com account and select a fork of this repo. Everything should be configured already.
