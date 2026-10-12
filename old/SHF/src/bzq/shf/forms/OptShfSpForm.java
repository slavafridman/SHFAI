package bzq.shf.forms;

import bzq.shf.bean.OptShSpFlagBean;
import bzq.shf.profile.UserProfile;

public class OptShfSpForm extends OptShSpFlagBean {
	
	protected String[] flaggedUnits;
	protected UserProfile userProfile;

	public String[] getFlaggedUnits() {
		return flaggedUnits;
	}

	public void setFlaggedUnits(String[] flaggedUnits) {
		this.flaggedUnits = flaggedUnits;
	}

	public UserProfile getUserProfile() {
		return userProfile;
	}

	public void setUserProfile(UserProfile userProfile) {
		this.userProfile = userProfile;
	}


	
}
