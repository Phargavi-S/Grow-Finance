const Profile = require('../models/Profile');
const User = require('../models/User');

const emptyProfile = () => ({
  company: {
    logo: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    taxVatNumber: '',
    registrationNumber: '',
    businessAddress: ''
  },
  bank: {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    swiftBic: '',
    branchName: '',
    currency: 'EUR'
  },
  invoicePreferences: {
    defaultCurrency: 'EUR',
    paymentTerms: 'Due on Receipt',
    invoicePrefix: 'INV',
    invoiceNotes: '',
    companySignature: ''
  },
  userProfile: {
    profilePhoto: ''
  },
  branding: {
    companyLogo: '',
    themeColor: '#b2ff59'
  }
});

const mergeProfileResponse = (user, profile) => {
  const base = emptyProfile();
  const stored = profile ? profile.toObject() : {};

  const companyLogo = stored.branding?.companyLogo || stored.company?.logo || '';
  const company = {
    ...base.company,
    ...stored.company,
    logo: companyLogo || stored.company?.logo || ''
  };

  return {
    user: {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      businessName: user.businessName
    },
    company,
    bank: { ...base.bank, ...stored.bank },
    invoicePreferences: { ...base.invoicePreferences, ...stored.invoicePreferences },
    userProfile: {
      ...base.userProfile,
      ...stored.userProfile,
      fullName: user.fullName,
      email: user.email
    },
    branding: {
      ...base.branding,
      ...stored.branding,
      companyLogo: companyLogo || stored.branding?.companyLogo || ''
    }
  };
};

const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = await Profile.create({
        userId,
        company: {
          name: user.businessName || '',
          email: user.email || '',
          phone: user.phoneNumber || ''
        }
      });
    }

    res.json({
      success: true,
      profile: mergeProfileResponse(user, profile)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to load profile settings' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { company, bank, invoicePreferences, userProfile, branding } = req.body;

    if (company?.name !== undefined && !String(company.name).trim()) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    if (userProfile?.fullName) {
      user.fullName = String(userProfile.fullName).trim();
      req.session.fullName = user.fullName;
    }
    if (company?.name) {
      user.businessName = String(company.name).trim();
      req.session.businessName = user.businessName;
    }
    if (company?.phone !== undefined) {
      user.phoneNumber = String(company.phone).trim();
    }
    await user.save();

    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId });
    }

    if (company) {
      Object.assign(profile.company, company);
    }
    if (bank) {
      Object.assign(profile.bank, bank);
    }
    if (invoicePreferences) {
      Object.assign(profile.invoicePreferences, invoicePreferences);
    }
    if (userProfile) {
      if (userProfile.profilePhoto !== undefined) {
        profile.userProfile.profilePhoto = userProfile.profilePhoto;
      }
    }
    if (branding) {
      Object.assign(profile.branding, branding);
    }

    const logo = branding?.companyLogo || company?.logo;
    if (logo) {
      profile.company.logo = logo;
      profile.branding.companyLogo = logo;
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Profile settings saved successfully',
      profile: mergeProfileResponse(user, profile)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to save profile settings' });
  }
};

module.exports = {
  getProfile,
  updateProfile
};
