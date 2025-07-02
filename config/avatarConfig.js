export const readyPlayerMeApi = {
    apiKey: process.env.READY_PLAYER_ME_API_KEY,
    baseUrl: 'https://api.readyplayer.me/v1',
    
    async getBaseModel(gender) {
      const models = {
        male: 'https://models.readyplayer.me/6475930283a756c914f9c559.glb',
        female: 'https://models.readyplayer.me/6475934483a756c914f9c560.glb'
      };
      return models[gender];
    },
    
    async createAvatar(config) {
      try {
        const response = await fetch(`${this.baseUrl}/avatars`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...config,
            textureAtlas: true, // Enable texture atlas for better performance
            morphTargets: true, // Enable facial expressions
            lod: 1 // Level of detail (1 is optimal for mobile)
          })
        });
        
        if (!response.ok) throw new Error('Failed to create avatar');
        
        const data = await response.json();
        return data.avatarUrl;
      } catch (error) {
        console.error('Error creating avatar:', error);
        throw error;
      }
    }
  };