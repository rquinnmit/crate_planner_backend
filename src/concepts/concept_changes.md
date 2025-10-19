## CratePlanner

I changed the specification of CratePlanner to include the SpotifyQueryPlans so that it has access to a data
  structure which encompass the spotify track scraping process. I also added more actions related to the Spotify
    requests for better modularity and functionality.

## ExternalAssetImport

This concept is actually completely new. One of my previous concepts (MusicAssetCatalog) did not integrate well with the DynamoDB database tracking, so I scratched it entirely and shifted the concept space to the importing functionality. This concept allows us to connect to the database via an Importer and configures the API for a request. There are actions that facilitate the importing process (importing one track, multiple tracks, etc.) and handle request metrics. This concept is important because importing tracks and providing correct track metadata are so fundamental to our program.

## PlanExporter

I edited the PlanExporter concept to have more specific and diverse actions. Rekordbox and Serato have different methods of importing tracks, so I needed to create actions that modeled those processes.


## Issues

There weren't too many issues besides the elimination of my old MusicAssetCatalog concept. The three concepts that we have cover most of our program's functionality:
  bringing in, working with, and then exporting tracks.