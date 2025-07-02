

export const useAvatarSystem = () => {
    const [avatarConfig, setAvatarConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Load avatar configuration
    useEffect(() => {
      const loadAvatarConfig = async () => {
        try {
          setLoading(true);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data().avatarConfig) {
            setAvatarConfig(userDoc.data().avatarConfig);
          }
        } catch (err) {
          console.error('Error loading avatar config:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      
      if (auth.currentUser) {
        loadAvatarConfig();
      }
    }, []);
    
    // Update avatar configuration
    const updateAvatar = async (config) => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        await updateDoc(userRef, {
          avatarConfig: config,
          avatarUrl: config.avatarUrl,
          updatedAt: new Date()
        });
        
        setAvatarConfig(config);
        return config;
      } catch (err) {
        console.error('Error updating avatar:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };
    
    return {
      avatarConfig,
      loading,
      error,
      updateAvatar
    };
  };