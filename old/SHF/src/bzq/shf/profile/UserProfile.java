package bzq.shf.profile;

import java.util.Vector;


/**
 * הגדרת פרופיל משתמש
 * Creation date: (29/01/08)
 */
public class UserProfile {

	private String id;
	private String firstName;
	private String lastName;
	private String allowedMode;
    private Vector allowedActivities;
	private Vector allowedUnits;
	private String allowedMoked;
	private String allowedAgaf;
	private String allowedReplace;
	private int employeeId;

	/**
	 * @return
	 */
	public Vector getAllowedActivities() {
		return allowedActivities;
	}

	/**
	 * @return
	 */
	public String getAllowedMode() {
		return allowedMode;
	}


	/**
	 * @return
	 */
	public String getFirstName() {
		return firstName;
	}


	/**
	 * @return
	 */
	public String getId() {
		return id;
	}


	/**
	 * @return
	 */
	public String getLastName() {
		return lastName;
	}


	/**
	 * @param vector
	 */
	public void setAllowedActivities(Vector vector) {
		allowedActivities = vector;
	}


	/**
	 * @param string
	 */
	public void setAllowedMode(String string) {
		allowedMode = string;
	}


	/**
	 * @param string
	 */
	public void setFirstName(String string) {
		firstName = string;
	}


	/**
	 * @param string
	 */
	public void setId(String string) {
		id = string;
	}


	/**
	 * @param string
	 */
	public void setLastName(String string) {
		lastName = string;
	}


	/**
	 * @return
	 */
	public Vector getAllowedUnits() {
		return allowedUnits;
	}

	/**
	 * @param vector
	 */
	public void setAllowedUnits(Vector vector) {
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

	public String getAllowedReplace() {
		return allowedReplace;
	}


	public void setAllowedReplace(String allowedReplace) {
		this.allowedReplace = allowedReplace;
	}


	/**
	 * @return
	 */
	public int getEmployeeId() {
		return employeeId;
	}

	/**
	 * @param i
	 */
	public void setEmployeeId(int i) {
		employeeId = i;
	}
	
	/**
	 * @param agaf
	 */
	public void setAllowedAgaf(String agaf){
		this.allowedAgaf=agaf;
	}

	/**
	 * @return allowedAgaf
	 */
	public String getAllowedAgaf(){
		return allowedAgaf;
	}
}

