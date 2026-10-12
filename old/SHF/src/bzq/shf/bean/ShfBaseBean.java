package bzq.shf.bean;

import java.util.HashMap;

/**
 * Insert the type's description here. 
 * Creation date: (11/11/2002 13:51:06)
 * @author: Natana Cohen
 */

public abstract class ShfBaseBean extends bzq.forms.BaseForm implements ShfBaseInfo {

	private String userId;
	private String userFirstName;
	private String userLastName;
	private java.util.Vector allowedActivities;
	private java.util.Vector allowedUnits;
	private String allowedMoked;
	private String allowedAgaf;
	private String sourceActivity;
	

	public abstract java.util.HashMap getFieldsMapping();
	
	/**
	 * @return
	 */
	public java.util.Vector getAllowedActivities() {
		return allowedActivities;
	}

	/**
	 * @return
	 */
	public String getSourceActivity() {
		return sourceActivity;
	}

	/**
	 * @return
	 */
	public String getUserFirstName() {
		return userFirstName;
	}

	/**
	 * @return
	 */
	public String getUserId() {
		return userId;
	}

	/**
	 * @return
	 */
	public String getUserLastName() {
		return userLastName;
	}

	/**
	 * @param vector
	 */
	public void setAllowedActivities(java.util.Vector vector) {
		allowedActivities = vector;
	}

	/**
	 * @param string
	 */
	public void setSourceActivity(String string) {
		sourceActivity = string;
	}

	/**
	 * @param string
	 */
	public void setUserFirstName(String string) {
		userFirstName = string;
	}

	/**
	 * @param string
	 */
	public void setUserId(String string) {
		userId = string;
	}

	/**
	 * @param string
	 */
	public void setUserLastName(String string) {
		userLastName = string;
	}

	/**
	 * @return
	 */
	public java.util.Vector getAllowedUnits() {
		return allowedUnits;
	}

	/**
	 * @param vector
	 */
	public void setAllowedUnits(java.util.Vector vector) {
		allowedUnits = vector;
	}

	/**
	 * @return
	 */
	public String getAllowedMoked() {
		return allowedMoked;
	}

	/**
	 * @param string
	 */
	public void setAllowedMoked(String string) {
		allowedMoked = string;
	}

	public String getAllowedAgaf() {
		return allowedAgaf;
	}

	public void setAllowedAgaf(String allowedAgaf) {
		this.allowedAgaf = allowedAgaf;
	}

	
}
