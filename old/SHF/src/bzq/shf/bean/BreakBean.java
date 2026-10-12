/*
 * Created on 12/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BreakBean extends ExceptionBean{
	static {
		
		//from shf_employees
		fieldsMapping.put("FIRST_NAME","firstName");
		fieldsMapping.put("LAST_NAME","lastName");
		fieldsMapping.put("EMPLOYEE_ID","employeeId");
		fieldsMapping.put("EMP_ID_NUMBER","empIdNumber");
		fieldsMapping.put("ORG_UNIT_ID","orgUnitId");
		fieldsMapping.put("INNER_JOB_ID","innerJobId");
		//from shf_day_Changes
		fieldsMapping.put("NEW_ACTIVITY","newActivity");	
		//from shf_employee_day
		fieldsMapping.put("WM_SCH_ACTIVITY_ID_DATA","wmActivityId");
		fieldsMapping.put("WORK_FROM_HOME","workFromHome");
		fieldsMapping.put("NEW_WORK_FROM_HOME","newWorkFromHome");
		
	}
	
	
	protected String firstName;
	protected String lastName;
	protected String employeeId;
	protected String empIdNumber;
	protected String orgUnitId;
	protected String newActivity;
	protected String wmActivityId;
	//parameter for new candidate
	protected int isNewCandidate;
	//parameter for break view
	protected long minuteLate;
	protected String breakRemark;
	
	protected String innerJobId;
	protected String workFromHome;
	protected String newWorkFromHome;

	
	public String getInnerJobId() {
		return innerJobId;
	}

	public void setInnerJobId(String innerJobId) {
		this.innerJobId = innerJobId;
	}

	public long getMinuteLate() {
		return minuteLate;
	}

	public void setMinuteLate(long minuteLate) {
		this.minuteLate = minuteLate;
	}

	public String getBreakRemark() {
		return breakRemark;
	}

	public void setBreakRemark(String breakRemark) {
		this.breakRemark = breakRemark;
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
	public String getLastName() {
		return lastName;
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
	public void setLastName(String string) {
		lastName = string;
	}

	/**
	 * @return
	 */
	public String getEmployeeId() {
		return employeeId;
	}

	/**
	 * @param string
	 */
	public void setEmployeeId(String string) {
		employeeId = string;
	}

	public String getEmpIdNumber() {
		return empIdNumber;
	}

	public void setEmpIdNumber(String empIdNumber) {
		this.empIdNumber = empIdNumber;
	}

	/**
	 * @return
	 */
	public String getNewActivity() {
		return newActivity;
	}

	/**
	 * @return
	 */
	public String getOrgUnitId() {
		return orgUnitId;
	}


	/**
	 * @param string
	 */
	public void setNewActivity(String string) {
		newActivity = string;
	}

	/**
	 * @param string
	 */
	public void setOrgUnitId(String string) {
		orgUnitId = string;
	}


	/**
	 * @return
	 */
	public String getWmActivityId() {
		return wmActivityId;
	}

	/**
	 * @param string
	 */
	public void setWmActivityId(String string) {
		wmActivityId = string;
	}
	
	/**
	 * Add by Yuval
	 * @param string
	 */	
	public String getActivity() {
		return newActivity==null?wmActivityId:newActivity;
	}
	/**
	 * @return
	 */
	public int getIsNewCandidate() {
		return isNewCandidate;
	}

	/**
	 * @param i
	 */
	public void setIsNewCandidate(int i) {
		isNewCandidate = i;
	}

	public String getWorkFromHome() {
		return workFromHome;
	}

	public void setWorkFromHome(String workFromHome) {
		this.workFromHome = workFromHome;
	}

	public String getNewWorkFromHome() {
		return newWorkFromHome;
	}

	public void setNewWorkFromHome(String newWorkFromHome) {
		this.newWorkFromHome = newWorkFromHome;
	}

	public boolean isWorkingFromHome() {
		return this.newWorkFromHome != null ? (this.newWorkFromHome.equalsIgnoreCase("y") ? true : false) : (this.workFromHome.equalsIgnoreCase("y") ? true : false);
	}
}
