# Changes to the Application + Interesting Moment

## Eliminating MusicAssetCatalog

A big frustration that I encountered was integrating the already written MusicAssetCatalog concept class with the MongoDB architecture.
MusicAssetCatalog basically had the same functionality as MongoDB, but allowed for more versatility with method calls.
I ended up scratching the MusicAssetCatalog altogether, which allowed me to just use MongoDB as the sole storer of tracks.
This simplified the design significantly and prevented wasted time from integration.

Here's a link to the class that contains the MongoDB functionality:

![catalog_db](./core/catalog_db.ts)

## Seed Tracks

I struggled to find a use case for the seed tracks functionality. Essentially, I was going to allow users to import a couple of audio tracks for (a) the LLM to parse and use as derived intent or (b) the LLM uses those tracks in the crate it generates. However, neither situations had a great return on investment. Having an LLM analyze track features would be too expensive, and having users import tracks to put in a crate seemed rather useless.

I ended up removing this functionality completely. I don't have any references that would help explain this interesting moment.

## Adding ExternalAssetImport

I came to the realization that having track importing functionality was one of the most essential parts of our application. It allows our program to access external APIs to retrieve information on tracks.

I added a concept spec for it that outlines the different importing actions. This gives a baseline for getting the tracks and track information to our LLM for processing.

Here is the script that covers this logic:

![base_importer](./import/base_importer.ts)

## Issues with Spotify API

I was running into issues where our LLM would always default track metadata BPM and key values to a certain metric (120 BPM, 8A). This was strange, since I knew that every song didn't have the same BPM and key. I realized that, because of the way the Spotify API works, accessing BPM and key metrics involves some sort of authentication. Other metrics like song length are completely accessible.

In an attempt to solve this issue, I had the LLM make inferences on the BPM and key rather than just naturally defaulting the values to 120 BPM and 8A. I'm still researching into how these values could be pulled more accurately, but for now, this strategy has decent accuracy.

Here is a reference to the script that handles the defaulting + inferencing methodology:

![spotify_importer](./import/spotify_importer.ts)

## LLM creating effective prompts

I had the general use LLM help me generate prompts for our track searching LLM. It came up with some surprisingly good ideas. One aspect that I found interesting was assigning the LLM to the role of an "expert DJ assistant analyzing an event prompt to create a structured crate plan". I didn't know this would make the LLM more effective than having no assigned role, but it seems to work well.

There are numerous different prompt types that are provided for our LLM, most including example responses.

Here is the reference to the crate generating prompts:

![crate_prompting](./prompts/crate_prompting.ts)

## Key Conversion Process

I had to navigate how I was going to normalize the track keys so that they could be compared against eachother. I decided on using Camelot keys, which are very DJ-centric and standard for this type of work. This was after I had issues using musical keys.

Here is the reference for my key logic:

![camelot_keys](./utils/camelot.ts)