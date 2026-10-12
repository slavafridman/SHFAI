/*
 * Created on 26/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceByCritrion extends ShfBaseBean{	

	private String shiftId;
	private String site;
	private Date startTime;
	private Date endTime;
	private String activity;
	private String employeePersonalId;	
	private String employeeId;
	private String fullname;	
	private String managerId;	
	private String innerJob;
	private String employeeOrgUnit;
	private String switchPotentialFormSite;
	private String switchPotentialList;
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */	
	 


	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("SITE", "site");
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID", "shiftId");
		fieldsMapping.put("STARTTIME", "startTime");
		fieldsMapping.put("ENDTIME", "endTime");
		fieldsMapping.put("ACTIVITY", "activity");
		fieldsMapping.put("EMPLOYEE_ID","employeeId");
		fieldsMapping.put("EMP_ID_NUMBER","employeePersonalId");
		fieldsMapping.put("FULLNAME","fullname");		
		fieldsMapping.put("MANAGER_ID","managerId");
		fieldsMapping.put("INNER_JOB_ID","innerJob");
		fieldsMapping.put("ORG_UNIT_ID","employeeOrgUnit");
	}

	
	
	public String getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String innerJob) {
		this.innerJob = innerJob;
	}

	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @return
	 */
	public Date getEndTime() {
		return endTime;
	}

	/**
	 * @return
	 */
	public String getShiftId() {
		return shiftId;
	}

	/**
	 * @return
	 */
	public String getSite() {
		return site;
	}

	/**
	 * @return
	 */
	public Date getStartTime() {
		return startTime;
	}

	/**
	 * @param string
	 */
	public void setActivity(String string) {
		activity = string;
	}

	/**
	 * @param string
	 */
	public void setEndTime(Date date) {
		endTime = date;
	}

	/**
	 * @param string
	 */
	public void setShiftId(String string) {
		shiftId = string;
	}

	/**
	 * @param string
	 */
	public void setSite(String string) {
		site = string;
	}

	/**
	 * @param string
	 */
	public void setStartTime(Date date) {
		startTime = date;
	}


	/**
	 * @return
	 */
	public String getEmployeePersonalId() {
		return employeePersonalId;
	}

	/**
	 * @param string
	 */
	public void setEmployeePersonalId(String string) {
		employeePersonalId = string;
	}

	/**
	 * @return
	 */
	public String getFullname() {
		return fullname;
	}

	/**
	 * @param string
	 */
	public void setFullname(String string) {
		fullname = string;
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

	/**
	 * @return
	 */
	public String getManagerId() {
		return managerId;
	}

	/**
	 * @param string
	 */
	public void setManagerId(String string) {
		managerId = string;
	}

	/**
	 * @return
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	public String getEmployeeOrgUnit() {
		return employeeOrgUnit;
	}

	public void setEmployeeOrgUnit(String employeeOrgUnit) {
		this.employeeOrgUnit = employeeOrgUnit;
	}

	public void setSwitchPotentialFormSite(String switchPotentialFormSite) {
		this.switchPotentialFormSite = switchPotentialFormSite;
	}

	public String getSwitchPotentialFormSite() {
		return switchPotentialFormSite;
	}

	public String getSwitchPotentialList() {
		return switchPotentialList;
	}

	public void setSwitchPotentialList(String switchPotentialList) {
		this.switchPotentialList = switchPotentialList;
	}

	
}
