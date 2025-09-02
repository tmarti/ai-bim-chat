## bim-chat

An AI enabled app that allows to talk to your BIM models.

## clone it!

```
git clone https://github.com/tmarti/ai-bim-chat.git
```

## configure it!

Edit `src/initialization/env.ts` and insert your openai api key:

```ts
export const env = {
  openAIApiKey: "you openai api key goes here", // <= put it here
  showInitialSuggestions: true,
};
```

## install it!

```
npm ci
```

## run it!

```
npm run dev
```

Now you can navigate to [http://localhost:5173/](http://localhost:5173/)

## License

This project is licensed under the terms of the **GNU Affero General Public License v3.0 (AGPL-3.0)**.  
See the [LICENSE](LICENSE) file for details.

Copyright © [2025] [[Toni Martí Coll](https://www.linkedin.com/in/toni-mart%C3%AD-392604103/)]