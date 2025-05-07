# Roots: Take Home Project

Thank you for taking the time to interview for Roots! This take home assignment should give you
some idea of the work we do here and allow you to demonstrate your abilities as a developer.

We are not expecting perfection. We want to see how you tackle a new challenge. 

### Work Style
As I mentioned in the interview, we have plenty of work on the Frontend and Backend. So, for this assignment I'd like you to choose a path below based on your own interest. This does not lock you into this workstype if hired, but I am hoping it allows for you to best demonstrate your abilities, wherever they may lie.
- **80% Frontend / 20% Backend** - Write a simple API endpoint or two to fetch some data and then really focus on creating a beatiful, interactive, responsive interface. We have many mobile customers, so bonus points if your layout works or adapts to mobile resolution. More points will be given to the cleanliness and design of the interface. Animations, hover effects, trendy visuals encouraged tastefully done. 
- **50% Frontend / 50% Backend** - Write a simple, functional UI that is moderately complex. The UI should serve a relatively robust API, allowing for basic CRUD operations and some interesting/complex queries. 
- **20% Frontend / 80% Backend** - You are allowed to implement a backend engineer's UI (i.e. barebones, ugly, but functional). Focus on a complex and interesting API with data processing functions, complex queries, and detailed/useful logging. 

### Challenges
I'd like you to focus on one or two of the below challenges, depending on your preferred work style selected above. These are open ended, not all subpoints need to be addressed. Just build something you find interesting and useful.
- **Map Component:**
  - Implement a map that displays listings markers within the map region. 
  - Make map markers slightly interactive, allowing for favoriting or labeling or displaying more info on click. Can you save favorited state locally?. 
  - If possible, implement some kind of filtering. Let the user filter the map by price, assumability, listing age, status, etc. 
  - Consider advanced map features like draw/area search, clustering, or rendering hundreds of markers.
  - Make sure the map is performant and runs well even with lots of data displayed
- **Dashboard:**
  - Create a dashboard that shows interesting insights about our data
  - Create tables and your own charts (or via a chart/diagram library) to display information
  - Examples of things you could answer through data: What does the price distribution of listings look like? Where are our assumable listings? How often are listings updated? How long do listings stay on market? What does the age profile and balance of our assumable mortgages look like?
  - Is dashboard data fetched live or on refresh?
  - In our real databases, we are receiving hundreds of raw listings and generating hundreds of listings daily. How can we visualize trends over time? What temporal information may be interesting to see?
- **Data Processor:**
  - Create a processor class or series of functions that can process RawListingData and generate Listings. Keep in mind field types and values may not always be 100% consistent. 
  - Consider a similar processor that takes in RawLoanData and generates Loans. 
  - You do not actually have to create database entries for the Listings or Loans. You could create an endpoint that takes in a date range, finds all raw listings in that date range, and returns normalized data for those listings in JSON format. 
  - Benchmark your processor. How quickly can it process and save 1,000 `rawListingDat` records. What are the bottlenecks?

Core principals I am looking for:
- Code organization - How do you organize code within a file, how do you organize files and folder structure?
- Documentation - Are you writing inline comments where necessary to explain complex logic? Are you writing clear and concise function [docstrings](https://stackoverflow.com/questions/34205666/utilizing-docstrings)?
- Creativity - Is your UI creative, sharp, clean, and/or cute? Does your API solve an interesting problem or serve valuable information?
- Error Handling - Are types checked? Optional chaining? Are try/catch blocks implemented in the API?
- Commit Structure - Are you making regular commits? Do your commits make sense?
- Typing - Are you creating interfaces for props? Did you create Types/Interfaces for the key variables? (don't worry, you can still use `any` most of the time)

-----

## Rules and Guidance
General rules:
- Use our site for design and functionality inspiration: https://roots.homes (Lauren loves the green/black color scheme ([neobrutalism](https://www.neobrutalism.dev/) adjacent), I love sleek modern designs)
- **AI use is actively encouraged**, but make sure you are able to intelligently speak about your code and what it does. Also, I _highly encourage_ you to remove ChatGPT comments and write _your own code comments_.
- **You can install whatever packages you want** into the application so long as it still builds and runs
- I have installed Chakra UI (3.0) as a design library but you are welcome to use Tailwind (also installed) or any other design library for frontend work
- State management may be necessary. Use any library if needed or store in local `useState`.
- I've supplied you with a **Mapbox API token** should you choose to create a map component
- You can use built-in fetch/Axios for API requests or use Tanstack query
- I genuinely do not care if you use the same libraries we use or if you use ones you are more comfortable with.

### Getting Started

**Pre-Setup:**
1. Click `Use this template` button on Github
2. Create a new public repository (so that it can be shared with me later)
3. Download the code
4. Make sure you have `pnpm` [installed on your machine](https://pnpm.io/installation) first:
  `corepack prepare pnpm@latest --activate`

**App Setup:**
1. Add environment variables to the .env file
2. Run `source .env` to load the variables
3. Run `pnpm i` to install all packages
4. Run `pnpm dev` to run the app locally
5. Go to `localhost:3000` to see the application

The starter code consists of a simple home page with a button that calls an API route. Frontend pages go in the `/app` folder (so `/my-map` page would be in `/app/my-mapp/page.tsx`) and api routes can be added to `/app/api/`.
I've added a database diagram in the images folder `/public/ListingDB Diagram.png` so you can see how some of the models are connected. The models of interst are:
- `Listing` - this is the processed listing model, we use this to display info to the user on the map
- `PropertyRadar` - an intermediary model that stores some generic info for the listing
- `Loan` - a loan model, may be Assumable (VA or FHA loans are assumable) or Traditional (everything else)
- `AssumableMortgage` - if a `Loan` is Assumable, it will be connected to an `AssumableMortgage` record
- `RawListingData` - this is unprocessed data we retrieve from external MLS APIs
- `RawLoanData` - this is unprocessed data we pull from external loan APIs

The key connections are: 
- `Listings -> PropertyRadar -> Loan -> AssumableMorgage`
- `RawListingData -> RawLoanData and RawPhotoData`

-----

## Resources
### Mapbox API
- [React Map GL](https://visgl.github.io/react-map-gl/docs/api-reference/mapbox/map)
- [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/api/map/)
- [Mapbox Search Box API](https://docs.mapbox.com/mapbox-search-js/api/react/search/)
- [Mapbox Search Box Playground](https://docs.mapbox.com/playground/search-box/)

### API Layer
- [Prisma](https://www.prisma.io/docs/orm/overview/prisma-in-your-stack/rest)
- [Tanstack Query](https://tanstack.com/query/latest/docs/framework/react/overview) - Our FE API library
- [Tanstack - Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries) - For GET requests
- [TanStack - Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) - For POST/PUT requests
- [Next.js](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

### State
- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction) - Our state management library
- [Zustand - Updating State](https://zustand.docs.pmnd.rs/guides/updating-state)
- [Zustand - TS](https://zustand.docs.pmnd.rs/guides/typescript)

### Next.js
- [Next.js App Router](https://nextjs.org/docs/app/getting-started/layouts-and-pages)

### Design Systems and UI
- [Figma Design](https://www.figma.com/design/achn31wyF0Mmmoj1RW28Eg/Roots-(Copy)?node-id=3193-2)
- [Chakra UI Components](https://www.chakra-ui.com/docs/components/concepts/overview)
- [Chakra UI Responsive Design](https://www.chakra-ui.com/docs/styling/responsive-design)
- [Motion](https://motion.dev/docs/react-animation)
- [Lucide Icons](https://lucide.dev/icons/)
