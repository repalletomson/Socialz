import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import SelectionModal from '../../../components/SelectionModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../config/supabaseConfig';
import { useLocalSearchParams } from 'expo-router';

// Updated black theme with purple accents
const colors = {
  background: '#000000',
  surface: '#111111',
  cardBg: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  accent: '#8B5CF6',
  accentBg: '#8B5CF6',
  accentText: '#FFFFFF',
  border: '#333333',
  inputBg: '#1A1A1A',
  inputBorder: '#333333',
  success: '#22C55E',
  warning: '#F59E0B',
  modalBg: 'rgba(0,0,0,0.8)',
  selectedBg: '#8B5CF6',
  selectedText: '#FFFFFF',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',
  manualEntry: '#4F46E5',
};

const currentYear = new Date().getFullYear();
const startYear = 2022;
const endYear = currentYear + 6;
const passoutYears = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

// Engineering colleges with short forms and search keywords
const engineeringColleges = [
  {
    id: 1,
    fullName: "Indian Institute of Technology Hyderabad",
    shortForm: "IIT Hyderabad",
    searchKeywords: ["iit", "indian institute of technology", "iit hyderabad", "iiith"]
  },
  {
    id: 2,
    fullName: "National Institute of Technology Warangal",
    shortForm: "NIT Warangal",
    searchKeywords: ["nit", "national institute of technology", "nit warangal", "nitw"]
  },
  {
    id: 3,
    fullName: "International Institute of Information Technology Hyderabad",
    shortForm: "IIIT Hyderabad",
    searchKeywords: ["iiit", "international institute of information technology", "iiit hyderabad", "iiith"]
  },
  {
    id: 4,
    fullName: "Birla Institute of Technology and Science Hyderabad",
    shortForm: "BITS Hyderabad",
    searchKeywords: ["bits", "birla institute of technology", "bits hyderabad", "birla"]
  },
  {
    id: 5,
    fullName: "Jawaharlal Nehru Technological University Hyderabad",
    shortForm: "JNTUH",
    searchKeywords: ["jntu", "jawaharlal nehru technological university", "jntuh", "jntu hyderabad"]
  },
  {
    id: 6,
    fullName: "University College of Engineering, Osmania University",
    shortForm: "UCE Osmania",
    searchKeywords: ["uce", "university college of engineering", "osmania", "uce osmania"]
  },
  {
    id: 7,
    fullName: "Chaitanya Bharathi Institute of Technology",
    shortForm: "CBIT",
    searchKeywords: ["cbit", "chaitanya bharathi institute of technology", "chaitanya bharathi", "cbit hyderabad"]
  },
  {
    id: 8,
    fullName: "Vasavi College of Engineering",
    shortForm: "VCE",
    searchKeywords: ["vce", "vasavi college of engineering", "vasavi", "vasavi college"]
  },
  {
    id: 9,
    fullName: "VNR Vignana Jyothi Institute of Engineering & Technology",
    shortForm: "VNRVJIET",
    searchKeywords: ["vnr", "vignana jyothi", "vnrvjiet", "vnr vignana jyothi"]
  },
  {
    id: 10,
    fullName: "Gokaraju Rangaraju Institute of Engineering and Technology",
    shortForm: "GRIET",
    searchKeywords: ["griet", "gokaraju rangaraju", "gr institute", "gokaraju rangaraju institute"]
  },
  {
    id: 11,
    fullName: "Mahatma Gandhi Institute of Technology",
    shortForm: "MGIT",
    searchKeywords: ["mgit", "mahatma gandhi institute", "mg institute", "mahatma gandhi institute of technology"]
  },
  {
    id: 12,
    fullName: "CVR College of Engineering",
    shortForm: "CVR",
    searchKeywords: ["cvr", "cvr college of engineering", "cvr college", "cvr engineering"]
  },
  {
    id: 13,
    fullName: "CMR Institute of Technology",
    shortForm: "CMRIT",
    searchKeywords: ["cmr", "cmr institute", "cmrit", "cmr institute of technology"]
  },
  {
    id: 14,
    fullName: "MLR Institute of Technology",
    shortForm: "MLRIT",
    searchKeywords: ["mlr", "mlr institute", "mlrit", "mlr institute of technology"]
  },
  {
    id: 15,
    fullName: "Malla Reddy Engineering College",
    shortForm: "MREC",
    searchKeywords: ["mrec", "malla reddy", "malla reddy engineering", "malla reddy college"]
  },
  {
    id: 16,
    fullName: "Keshav Memorial Institute of Technology",
    shortForm: "KMIT",
    searchKeywords: ["kmit", "keshav memorial", "keshav memorial institute", "km institute"]
  },
  {
    id: 17,
    fullName: "Sreenidhi Institute of Science and Technology",
    shortForm: "SNIST",
    searchKeywords: ["snist", "sreenidhi", "sreenidhi institute", "sreenidhi institute of science"]
  },
  {
    id: 18,
    fullName: "Lords Institute of Engineering and Technology",
    shortForm: "LIET",
    searchKeywords: ["liet", "lords", "lords institute", "lords engineering"]
  },
  {
    id: 19,
    fullName: "BVRIT Hyderabad",
    shortForm: "BVRIT",
    searchKeywords: ["bvrit", "bvr institute", "bvrit hyderabad", "bvr"]
  },
  {
    id: 20,
    fullName: "J.B. Institute of Engineering and Technology",
    shortForm: "JBIET",
    searchKeywords: ["jbiet", "jb institute", "j.b. institute", "jb engineering"]
  }
];

// Branches with short forms and search keywords
const allBranches = [
  {
    id: 1,
    fullName: "Computer Science and Engineering",
    shortForm: "CSE",
    searchKeywords: ["cse", "computer science", "computer science and engineering", "cs"]
  },
  {
    id: 2,
    fullName: "Information Technology",
    shortForm: "IT",
    searchKeywords: ["it", "information technology", "info tech"]
  },
  {
    id: 3,
    fullName: "Artificial Intelligence and Machine Learning",
    shortForm: "AIML",
    searchKeywords: ["aiml", "artificial intelligence", "machine learning", "ai ml", "ai/ml"]
  },
  {
    id: 4,
    fullName: "Data Science",
    shortForm: "DS",
    searchKeywords: ["ds", "data science", "data sciences"]
  },
  {
    id: 5,
    fullName: "Cyber Security",
    shortForm: "CS",
    searchKeywords: ["cyber security", "cybersecurity", "cyber", "security"]
  },
  {
    id: 6,
    fullName: "Electronics and Communication Engineering",
    shortForm: "ECE",
    searchKeywords: ["ece", "electronics", "electronics and communication", "communication engineering"]
  },
  {
    id: 7,
    fullName: "Electrical and Electronics Engineering",
    shortForm: "EEE",
    searchKeywords: ["eee", "electrical", "electrical and electronics", "electrical engineering"]
  },
  {
    id: 8,
    fullName: "Mechanical Engineering",
    shortForm: "ME",
    searchKeywords: ["me", "mechanical", "mechanical engineering", "mech"]
  },
  {
    id: 9,
    fullName: "Civil Engineering",
    shortForm: "CE",
    searchKeywords: ["ce", "civil", "civil engineering"]
  },
  {
    id: 10,
    fullName: "Chemical Engineering",
    shortForm: "CHE",
    searchKeywords: ["che", "chemical", "chemical engineering", "chem"]
  },
  {
    id: 11,
    fullName: "Metallurgical Engineering",
    shortForm: "META",
    searchKeywords: ["meta", "metallurgical", "metallurgy", "metallurgical engineering"]
  },
  {
    id: 12,
    fullName: "Instrumentation Engineering",
    shortForm: "IE",
    searchKeywords: ["ie", "instrumentation", "instrumentation engineering", "inst"]
  },
  {
    id: 13,
    fullName: "Aeronautical Engineering",
    shortForm: "AE",
    searchKeywords: ["ae", "aeronautical", "aeronautical engineering", "aero"]
  },
  {
    id: 14,
    fullName: "Mechatronics",
    shortForm: "MEC",
    searchKeywords: ["mec", "mechatronics", "mechatronics engineering"]
  },
  {
    id: 15,
    fullName: "Biomedical Engineering",
    shortForm: "BME",
    searchKeywords: ["bme", "biomedical", "biomedical engineering", "bio medical"]
  },
  {
    id: 16,
    fullName: "Biotechnology",
    shortForm: "BT",
    searchKeywords: ["bt", "biotechnology", "biotech", "bio technology"]
  },
  {
    id: 17,
    fullName: "Bachelor of Computer Applications",
    shortForm: "BCA",
    searchKeywords: ["bca", "bachelor of computer applications", "computer applications"]
  },
  {
    id: 18,
    fullName: "Bachelor of Commerce",
    shortForm: "B.Com",
    searchKeywords: ["bcom", "b.com", "bachelor of commerce", "commerce"]
  },
  {
    id: 19,
    fullName: "Bachelor of Business Administration",
    shortForm: "BBA",
    searchKeywords: ["bba", "bachelor of business administration", "business administration"]
  },
  {
    id: 20,
    fullName: "Bachelor of Science Computer Science",
    shortForm: "B.Sc CS",
    searchKeywords: ["bsc cs", "b.sc computer science", "bsc computer science", "bachelor of science computer science"]
  }
];

export default function EducationDetailsStep({ prevStep, finishOnboarding, userData, updateUserData }) {

  const [college, setCollege] = useState(userData?.college?.name || '');
const [branch, setBranch] = useState(userData?.branch || '');
const [passoutYear, setPassoutYear] = useState(userData?.passoutYear || '');
const [selectedInterests, setSelectedInterests] = useState(userData?.interests || []); // Add this if needed
  const [loading, setLoading] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [collegeModalVisible, setCollegeModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [filteredColleges, setFilteredColleges] = useState(engineeringColleges.slice(0, 8));
  const [filteredBranches, setFilteredBranches] = useState(allBranches.slice(0, 8));
  const [showManualCollegeEntry, setShowManualCollegeEntry] = useState(false);
  const [showManualBranchEntry, setShowManualBranchEntry] = useState(false);
  const [manualCollege, setManualCollege] = useState('');
  const [manualBranch, setManualBranch] = useState('');

  const { user, updateUserProfile } = useAuthStore();
  const router = useRouter();

  // Filter colleges based on search
  useEffect(() => {
    if (collegeSearch.trim() === '') {
      setFilteredColleges(engineeringColleges.slice(0, 8));
    } else {
      const searchTerm = collegeSearch.toLowerCase();
      const filtered = engineeringColleges.filter(college =>
        college.fullName.toLowerCase().includes(searchTerm) ||
        college.shortForm.toLowerCase().includes(searchTerm) ||
        college.searchKeywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
      setFilteredColleges(filtered);
    }
  }, [collegeSearch]);

  // Filter branches based on search
  useEffect(() => {
    if (branchSearch.trim() === '') {
      setFilteredBranches(allBranches.slice(0, 8));
    } else {
      const searchTerm = branchSearch.toLowerCase();
      const filtered = allBranches.filter(branch =>
        branch.fullName.toLowerCase().includes(searchTerm) ||
        branch.shortForm.toLowerCase().includes(searchTerm) ||
        branch.searchKeywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
      setFilteredBranches(filtered);
    }
  }, [branchSearch]);

  const getCollegeModalData = () => {
    const data = [...filteredColleges];
    data.push('manual');
    return data;
  };

  const getBranchModalData = () => {
    const data = [...filteredBranches];
    data.push('manual');
    return data;
  };

  const handleCollegeSelect = (selectedCollege) => {
    if (selectedCollege === 'manual') {
      setShowManualCollegeEntry(true);
      return;
    }
    setCollege(selectedCollege.shortForm);
    setCollegeModalVisible(false);
    setCollegeSearch('');
    setShowManualCollegeEntry(false);
  };

  const handleBranchSelect = (selectedBranch) => {
    if (selectedBranch === 'manual') {
      setShowManualBranchEntry(true);
      return;
    }
    setBranch(selectedBranch.shortForm);
    setBranchModalVisible(false);
    setBranchSearch('');
    setShowManualBranchEntry(false);
  };

  const handleManualCollegeSubmit = () => {
    if (manualCollege.trim()) {
      setCollege(manualCollege.trim());
      setCollegeModalVisible(false);
      setShowManualCollegeEntry(false);
      setManualCollege('');
      setCollegeSearch('');
    }
  };

  const handleManualBranchSubmit = () => {
    if (manualBranch.trim()) {
      setBranch(manualBranch.trim());
      setBranchModalVisible(false);
      setShowManualBranchEntry(false);
      setManualBranch('');
      setBranchSearch('');
    }
  };

  const handleNext = async () => {
    if (!college || !branch || !passoutYear) {
      Alert.alert('Error', 'Please fill in all education details');
      return;
    }
  
    if (!user) {
      Alert.alert('Error', 'Please log in to continue.');
      return;
    }
  
    setLoading(true);
    console.log("userData",userData);
  
    try {
      const educationData = {
        college:college,
        branch,
        passout_year: passoutYear,
        full_name: userData?.full_name || userData?.fullName,
        username: userData?.username,
        bio: userData?.bio || userData?.about,
        profile_image: userData?.profile_image || userData?.profileImage,
        onboarding_completed: true,
        interests: selectedInterests || userData?.interests || [], // Ensure interests is included
      };
  
      console.log("educationData", educationData);
  
      updateUserData(educationData);
  
      const success = await updateUserProfile(educationData);
      if (!success) {
        throw new Error('Profile update failed in Supabase');
      }
  
      updateUserProfile({
        ...user,
        ...educationData,
        onboarding_completed: true,
      });
  
      Alert.alert(
        'Welcome!',
        'Your profile has been set up successfully. You can now start using the app.',
        [
          {
            text: 'Get Started',
            onPress: () => finishOnboarding(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating education details:', error.message);
      if (error.message.includes('No authenticated user')) {
        Alert.alert('Error', 'Please log in again to save your profile.');
      } else {
        Alert.alert('Error', 'Failed to save education details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCollegeItem = ({ item }) => {
    if (item === 'manual') {
      return (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.cardBg,
            marginHorizontal: scaleSize(10),
            marginVertical: verticalScale(5),
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.manualEntry,
            paddingHorizontal: scaleSize(20),
            paddingVertical: verticalScale(16),
          }}
          onPress={() => handleCollegeSelect(item)}
        >
          <MaterialIcons name="edit" size={20} color={colors.manualEntry} />
          <Text style={{
            ...TextStyles.body2,
            color: colors.manualEntry,
            marginLeft: scaleSize(12),
            fontWeight: '500',
          }}>
            College not listed? Enter manually
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
    <TouchableOpacity
      style={{
          paddingHorizontal: scaleSize(20),
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
          minHeight: verticalScale(60),
      }}
        onPress={() => handleCollegeSelect(item)}
    >
        <View style={{ flex: 1 }}>
      <Text style={{
            ...TextStyles.body2,
            color: colors.text,
        fontWeight: '600',
            fontSize: 16,
      }}>
            {item.shortForm}
      </Text>
          <Text style={{
            ...TextStyles.caption,
            color: colors.textMuted,
            marginTop: verticalScale(4),
            fontSize: 12,
          }}>
            {item.fullName}
          </Text>
        </View>
    </TouchableOpacity>
  );
  };

  const renderBranchItem = ({ item }) => {
    if (item === 'manual') {
  return (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.cardBg,
            marginHorizontal: scaleSize(10),
            marginVertical: verticalScale(5),
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.manualEntry,
            paddingHorizontal: scaleSize(20),
            paddingVertical: verticalScale(16),
          }}
          onPress={() => handleBranchSelect(item)}
        >
          <MaterialIcons name="edit" size={20} color={colors.manualEntry} />
          <Text style={{
            ...TextStyles.body2,
            color: colors.manualEntry,
            marginLeft: scaleSize(12),
            fontWeight: '500',
          }}>
            Branch not listed? Enter manually
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity
        style={{
          paddingHorizontal: scaleSize(20),
          paddingVertical: verticalScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          minHeight: verticalScale(60),
        }}
        onPress={() => handleBranchSelect(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            ...TextStyles.body2,
            color: colors.text,
            fontWeight: '600',
            fontSize: 16,
          }}>
            {item.shortForm}
          </Text>
          <Text style={{
            ...TextStyles.caption,
            color: colors.textMuted,
            marginTop: verticalScale(4),
            fontSize: 12,
          }}>
            {item.fullName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderYearItem = ({ item }) => (
    <TouchableOpacity
      style={{
        paddingHorizontal: scaleSize(20),
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        minHeight: verticalScale(60),
      }}
      onPress={() => {
        setPassoutYear(item.toString());
        setShowYearPicker(false);
      }}
    >
              <Text style={{
        ...TextStyles.body2,
                color: colors.text,
        fontWeight: '600',
        fontSize: 16,
              }}>
        {item}
              </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{
      flex: 1,
      backgroundColor: colors.background,
    }} showsVerticalScrollIndicator={false}>
      <View style={{
        paddingHorizontal: scaleSize(20),
        paddingTop: verticalScale(40),
        paddingBottom: verticalScale(30),
      }}>
              <Text style={{
          ...TextStyles.heading1,
                color: colors.text,
          marginBottom: verticalScale(8),
              }}>
          Education Details
              </Text>
              <Text style={{
          ...TextStyles.body2,
                color: colors.textMuted,
          lineHeight: 24,
              }}>
          Tell us about your educational background
              </Text>
            </View>

      <View style={{
        paddingHorizontal: scaleSize(20),
        paddingBottom: verticalScale(30),
      }}>
        {/* College Selection */}
        <View style={{ marginBottom: verticalScale(20) }}>
          <Text style={{
            ...TextStyles.body2,
            color: colors.text,
            marginBottom: verticalScale(8),
            fontWeight: '600',
          }}>
            College/University
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 12,
              paddingHorizontal: scaleSize(16),
              paddingVertical: verticalScale(16),
              minHeight: verticalScale(56),
            }}
            onPress={() => setCollegeModalVisible(true)}
          >
            <Text style={{
              ...TextStyles.body2,
              color: college ? colors.text : colors.textMuted,
              flex: 1,
            }}>
              {college || 'Select your college'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Branch Selection */}
        <View style={{ marginBottom: verticalScale(20) }}>
          <Text style={{
            ...TextStyles.body2,
            color: colors.text,
            marginBottom: verticalScale(8),
            fontWeight: '600',
          }}>
            Branch/Field of Study
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 12,
              paddingHorizontal: scaleSize(16),
              paddingVertical: verticalScale(16),
              minHeight: verticalScale(56),
            }}
            onPress={() => setBranchModalVisible(true)}
          >
            <Text style={{
              ...TextStyles.body2,
              color: branch ? colors.text : colors.textMuted,
              flex: 1,
            }}>
              {branch || 'Select your branch'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Passout Year Selection */}
        <View style={{ marginBottom: verticalScale(20) }}>
          <Text style={{
            ...TextStyles.body2,
            color: colors.text,
            marginBottom: verticalScale(8),
            fontWeight: '600',
          }}>
            Passout Year
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 12,
              paddingHorizontal: scaleSize(16),
              paddingVertical: verticalScale(16),
              minHeight: verticalScale(56),
            }}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={{
              ...TextStyles.body2,
              color: passoutYear ? colors.text : colors.textMuted,
              flex: 1,
            }}>
              {passoutYear || 'Select passout year'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        </View>

      {/* Navigation Buttons */}
        <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scaleSize(20),
        paddingBottom: verticalScale(40),
      }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: verticalScale(12),
            paddingHorizontal: scaleSize(16),
          }}
          onPress={prevStep}
        >
          <AntDesign name="left" size={20} color={colors.text} />
            <Text style={{
            ...TextStyles.body2,
            color: colors.text,
            marginLeft: scaleSize(8),
          }}>
            Back
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accentBg,
            paddingVertical: verticalScale(16),
            paddingHorizontal: scaleSize(32),
            borderRadius: 25,
            minWidth: scaleSize(120),
            justifyContent: 'center',
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={{
            ...TextStyles.body2,
            color: colors.accentText,
            fontWeight: '600',
            marginRight: scaleSize(8),
          }}>
            {loading ? 'Socialz.' : 'Complete'}
          </Text>
          {!loading && <AntDesign name="right" size={20} color={colors.accentText} />}
        </TouchableOpacity>
        </View>

      {/* College Selection Modal */}
      <Modal
        visible={collegeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCollegeModalVisible(false);
          setShowManualCollegeEntry(false);
          setManualCollege('');
          setCollegeSearch('');
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: colors.modalBg,
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            marginHorizontal: scaleSize(20),
            borderRadius: 16,
            maxHeight: '80%',
            paddingBottom: verticalScale(20),
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: scaleSize(20),
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{
                ...TextStyles.heading3,
                color: colors.text,
              }}>
                Select College
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCollegeModalVisible(false);
                  setShowManualCollegeEntry(false);
                  setManualCollege('');
                  setCollegeSearch('');
                }}
                style={{ padding: scaleSize(4) }}
              >
                <AntDesign name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {!showManualCollegeEntry ? (
              <>
                <TextInput
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: scaleSize(16),
                    paddingVertical: verticalScale(12),
                    margin: scaleSize(20),
                    marginTop: scaleSize(10),
                    color: colors.text,
                    ...TextStyles.body2,
                  }}
                  placeholder="Search colleges..."
                  placeholderTextColor={colors.textMuted}
                  value={collegeSearch}
                  onChangeText={setCollegeSearch}
                />

            <FlatList
                  data={getCollegeModalData()}
                  renderItem={renderCollegeItem}
                  keyExtractor={(item) => item === 'manual' ? 'manual' : item.id.toString()}
              showsVerticalScrollIndicator={false}
                  style={{ maxHeight: verticalScale(400) }}
                />
              </>
            ) : (
              <View style={{ padding: scaleSize(20) }}>
                <Text style={{
                  ...TextStyles.body2,
                  color: colors.text,
                  marginBottom: verticalScale(8),
                  fontWeight: '600',
                }}>
                  Enter College Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: scaleSize(16),
                    paddingVertical: verticalScale(12),
                    marginBottom: verticalScale(20),
                    color: colors.text,
                    ...TextStyles.body2,
                  }}
                  placeholder="Enter your college name"
                  placeholderTextColor={colors.textMuted}
                  value={manualCollege}
                  onChangeText={setManualCollege}
                  multiline
                  numberOfLines={2}
                />
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: verticalScale(12),
                      paddingHorizontal: scaleSize(20),
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => {
                      setShowManualCollegeEntry(false);
                      setManualCollege('');
                    }}
                  >
                    <Text style={{
                      ...TextStyles.body2,
                      color: colors.text,
                    }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingVertical: verticalScale(12),
                      paddingHorizontal: scaleSize(20),
                      borderRadius: 8,
                      backgroundColor: colors.accentBg,
                      opacity: manualCollege.trim() ? 1 : 0.5,
                    }}
                    onPress={handleManualCollegeSubmit}
                    disabled={!manualCollege.trim()}
                  >
                    <Text style={{
                      ...TextStyles.body2,
                      color: colors.accentText,
                      fontWeight: '600',
                    }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Branch Selection Modal */}
      <Modal
        visible={branchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setBranchModalVisible(false);
          setShowManualBranchEntry(false);
          setManualBranch('');
          setBranchSearch('');
        }}
      >
      <View style={{
          flex: 1,
          backgroundColor: colors.modalBg,
          justifyContent: 'center',
        }}>
          <View style={{
        backgroundColor: colors.surface,
            marginHorizontal: scaleSize(20),
            borderRadius: 16,
            maxHeight: '80%',
            paddingBottom: verticalScale(20),
          }}>
            <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
              padding: scaleSize(20),
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{
                ...TextStyles.heading3,
                color: colors.text,
              }}>
                Select Branch
              </Text>
        <TouchableOpacity
                onPress={() => {
                  setBranchModalVisible(false);
                  setShowManualBranchEntry(false);
                  setManualBranch('');
                  setBranchSearch('');
                }}
                style={{ padding: scaleSize(4) }}
              >
                <AntDesign name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {!showManualBranchEntry ? (
              <>
                <TextInput
          style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: scaleSize(16),
                    paddingVertical: verticalScale(12),
                    margin: scaleSize(20),
                    marginTop: scaleSize(10),
                    color: colors.text,
                    ...TextStyles.body2,
                  }}
                  placeholder="Search branches..."
                  placeholderTextColor={colors.textMuted}
                  value={branchSearch}
                  onChangeText={setBranchSearch}
                />

                <FlatList
                  data={getBranchModalData()}
                  renderItem={renderBranchItem}
                  keyExtractor={(item) => item === 'manual' ? 'manual' : item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: verticalScale(400) }}
                />
              </>
            ) : (
              <View style={{ padding: scaleSize(20) }}>
                <Text style={{
                  ...TextStyles.body2,
                  color: colors.text,
                  marginBottom: verticalScale(8),
                  fontWeight: '600',
                }}>
                  Enter Branch Name
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 12,
                    paddingHorizontal: scaleSize(16),
                    paddingVertical: verticalScale(12),
                    marginBottom: verticalScale(20),
                    color: colors.text,
                    ...TextStyles.body2,
                  }}
                  placeholder="Enter your branch/field of study"
                  placeholderTextColor={colors.textMuted}
                  value={manualBranch}
                  onChangeText={setManualBranch}
                  multiline
                  numberOfLines={2}
                />
                <View style={{
            flexDirection: 'row',
                  justifyContent: 'space-between',
            alignItems: 'center',
                }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: verticalScale(12),
                      paddingHorizontal: scaleSize(20),
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onPress={() => {
                      setShowManualBranchEntry(false);
                      setManualBranch('');
                    }}
                  >
          <Text style={{
                      ...TextStyles.body2,
                      color: colors.text,
                    }}>
                      Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
                      paddingVertical: verticalScale(12),
            paddingHorizontal: scaleSize(20),
                      borderRadius: 8,
                      backgroundColor: colors.accentBg,
                      opacity: manualBranch.trim() ? 1 : 0.5,
                    }}
                    onPress={handleManualBranchSubmit}
                    disabled={!manualBranch.trim()}
        >
          <Text style={{
                      ...TextStyles.body2,
                      color: colors.accentText,
            fontWeight: '600',
          }}>
                      Save
          </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Year Selection Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: colors.modalBg,
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: colors.surface,
            marginHorizontal: scaleSize(20),
            borderRadius: 16,
            maxHeight: '60%',
            paddingBottom: verticalScale(20),
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: scaleSize(20),
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{
                ...TextStyles.heading3,
                color: colors.text,
              }}>
                Select Passout Year
              </Text>
              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                style={{ padding: scaleSize(4) }}
              >
                <AntDesign name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
            
            <FlatList
              data={passoutYears}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: verticalScale(300) }}
            />
    </View>
        </View>
      </Modal>
    </ScrollView>
  );
} 