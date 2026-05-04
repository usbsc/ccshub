/**
 * Photo albums configuration
 * Defines local photo albums and their associated metadata
 */

export interface PhotoAlbum {
  id: string;
  name: string;
  folder: 'jv' | 'varsity' | 'freshman';
  url: string; // Adobe or external album URL
  teamId?: string;
  description?: string;
}

export const photoAlbums: PhotoAlbum[] = [
  {
    id: 'jv-replay',
    name: 'JV Replay',
    folder: 'jv',
    url: 'https://adobe.ly/4eR0wNL',
    description: 'JV team game replay video',
  },
  {
    id: 'varsity-replay',
    name: 'Varsity Replay',
    folder: 'varsity',
    url: 'https://adobe.ly/42ACP53',
    description: 'Varsity team game replay video',
  },
];
