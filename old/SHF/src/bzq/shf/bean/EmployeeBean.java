/*
 * Created on 20/07/2008
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
public class EmployeeBean extends ShfBaseBean{
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("EMPLOYEE_ID", "employeeId");
		fieldsMapping.put("EMP_ID_NUMBER", "idNumber");
		fieldsMapping.put("FIRST_NAME", "fname");
		fieldsMapping.put("LAST_NAME", "lname");
		fieldsMapping.put("CITY", "city");
		fieldsMapping.put("JOB_TIME", "jobTime");
		fieldsMapping.put("JOB_ID", "jobId");
		fieldsMapping.put("STATUS_ID", "statusId");
		fieldsMapping.put("ADRESS", "address");
		fieldsMapping.put("ORG_UNIT_ID", "orgUnitId");
		fieldsMapping.put("TAXI_ALLOWED", "taxiAllowed");
		fieldsMapping.put("SHF_LOCKED", "locked");
		fieldsMapping.put("TRAINED", "trained");
		fieldsMapping.put("MANAGER_ID", "managerId");
		fieldsMapping.put("TAXI_ADDRESS", "monitAddress");
		fieldsMapping.put("OPTIONAL1", "optional1");
		fieldsMapping.put("OPTIONAL2", "optional2");
		fieldsMapping.put("UPDATE_TIME", "updateTime");
		fieldsMapping.put("CREATION_TIME", "creationTime");
		fieldsMapping.put("MANAGER_NAME","managerName");
		fieldsMapping.put("BENZOOG_NAME","benzoogName");
		fieldsMapping.put("BENZOOG_TEL","benzoogTel");
		fieldsMapping.put("BEZEQ_START_DATE","bezeqStartDate");
		fieldsMapping.put("BIRTH_DATE","birthDate");
		fieldsMapping.put("CONTRACT_DESC","contractDesc");
		fieldsMapping.put("EMAIL","email");
		fieldsMapping.put("GENDER","gender");
		fieldsMapping.put("MOKED_START_DATE","mokedStartDate");
		fieldsMapping.put("SOCIAL_STATUS","socialStatus");
		fieldsMapping.put("ZIP_CODE","zipCode");
		fieldsMapping.put("HOME_PHONE","phoneHome");
		fieldsMapping.put("WORK_PHONE","phoneWork");
		fieldsMapping.put("CELLULAR_PHONE","phoneCellular");
		fieldsMapping.put("REPLACE_ALLOWED","replaceAllowed");
		fieldsMapping.put("INNER_JOB_ID","innerJobId");
		fieldsMapping.put("WORK_FROM_HOME","workFromHome");
		fieldsMapping.put("JOB_NAME","jobName");
		fieldsMapping.put("RECEIVE_SWITCH_SMS","receiveSwitchSMS");
	} 
	
	protected int employeeId;
	protected String idNumber;
	protected String fname;
	protected String lname;
	protected Date birthDate;
	protected String address;
	protected String city;
	protected String contractDesc;
	protected int jobTime;
	protected String jobId;
	protected String phoneHome;
	protected String phoneWork;
	protected String phoneCellular;
	protected String email;
	protected Date bezeqStartDate;
	protected int statusId;
	protected String gender;
	protected String orgUnitId;
	protected String socialStatus;
	protected int zipCode;
	protected int taxiAllowed;
	protected int locked;
	protected int trained;
	protected int replaceAllowed;
	protected String benzoogName;
	protected String benzoogTel;
	protected int managerId;
	protected String monitAddress;
	protected Date mokedStartDate;
	protected String optional1;
	protected String optional2;
	protected Date updateTime;
	protected Date creationTime;
	protected String managerName;
	protected String innerJobId;
	protected int workFromHome;
	protected String jobName;
	protected String receiveSwitchSMS;
	

	public EmployeeBean(){
		super();
	}
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}


	public String getInnerJobId() {
		return innerJobId;
	}
	public void setInnerJobId(String innerJob) {
		this.innerJobId = innerJob;
	}
	/**
	 * @return
	 */
	public String getAddress() {
		return address;
	}

	/**
	 * @return
	 */
	public String getBenzoogName() {
		return benzoogName;
	}

	/**
	 * @return
	 */
	public String getBenzoogTel() {
		return benzoogTel;
	}

	/**
	 * @return
	 */
	public Date getBezeqStartDate() {
		return bezeqStartDate;
	}

	/**
	 * @return
	 */
	public Date getBirthDate() {
		return birthDate;
	}

	/**
	 * @return
	 */
	public String getCity() {
		return city;
	}

	/**
	 * @return
	 */
	public String getContractDesc() {
		return contractDesc;
	}

	/**
	 * @return
	 */
	public Date getCreationTime() {
		return creationTime;
	}

	/**
	 * @return
	 */
	public String getEmail() {
		return email;
	}

	/**
	 * @return
	 */
	public int getEmployeeId() {
		return employeeId;
	}

	/**
	 * @return
	 */
	public String getFname() {
		return fname;
	}

	/**
	 * @return
	 */
	public String getGender() {
		return gender;
	}

	/**
	 * @return
	 */
	public String getIdNumber() {
		return idNumber;
	}

	/**
	 * @return
	 */
	public String getJobId() {
		return jobId;
	}

	/**
	 * @return
	 */
	public int getJobTime() {
		return jobTime;
	}

	/**
	 * @return
	 */
	public String getLname() {
		return lname;
	}

	
	/**
	 * @return
	 */
	public int getManagerId() {
		return managerId;
	}

	/**
	 * @return
	 */
	public String getManagerName() {
		return managerName;
	}

	/**
	 * @return
	 */
	public Date getMokedStartDate() {
		return mokedStartDate;
	}

	/**
	 * @return
	 */
	public String getMonitAddress() {
		return monitAddress;
	}

	/**
	 * @return
	 */
	public String getOptional1() {
		return optional1;
	}

	/**
	 * @return
	 */
	public String getOptional2() {
		return optional2;
	}

	/**
	 * @return
	 */
	public String getOrgUnitId() {
		return orgUnitId;
	}

	

	/**
	 * @return
	 */
	public String getSocialStatus() {
		return socialStatus;
	}

	/**
	 * @return
	 */
	public int getStatusId() {
		return statusId;
	}

	

	/**
	 * @return
	 */
	public Date getUpdateTime() {
		return updateTime;
	}

	/**
	 * @return
	 */
	public int getZipCode() {
		return zipCode;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param string
	 */
	public void setAddress(String string) {
		address = string;
	}

	/**
	 * @param string
	 */
	public void setBenzoogName(String string) {
		benzoogName = string;
	}

	/**
	 * @param string
	 */
	public void setBenzoogTel(String string) {
		benzoogTel = string;
	}

	/**
	 * @param date
	 */
	public void setBezeqStartDate(Date date) {
		bezeqStartDate = date;
	}

	/**
	 * @param date
	 */
	public void setBirthDate(Date date) {
		birthDate = date;
	}

	/**
	 * @param string
	 */
	public void setCity(String string) {
		city = string;
	}

	/**
	 * @param string
	 */
	public void setContractDesc(String string) {
		contractDesc = string;
	}

	/**
	 * @param date
	 */
	public void setCreationTime(Date date) {
		creationTime = date;
	}

	/**
	 * @param string
	 */
	public void setEmail(String string) {
		email = string;
	}

	/**
	 * @param i
	 */
	public void setEmployeeId(int i) {
		employeeId = i;
	}

	/**
	 * @param string
	 */
	public void setFname(String string) {
		fname = string;
	}

	/**
	 * @param c
	 */
	public void setGender(String c) {
		gender = c;
	}

	/**
	 * @param string
	 */
	public void setIdNumber(String string) {
		idNumber = string;
	}

	/**
	 * @param i
	 */
	public void setJobId(String i) {
		jobId = i;
	}

	/**
	 * @param i
	 */
	public void setJobTime(int i) {
		jobTime = i;
	}

	/**
	 * @param string
	 */
	public void setLname(String string) {
		lname = string;
	}

	

	/**
	 * @param i
	 */
	public void setManagerId(int i) {
		managerId = i;
	}

	/**
	 * @param string
	 */
	public void setManagerName(String string) {
		managerName = string;
	}

	/**
	 * @param date
	 */
	public void setMokedStartDate(Date date) {
		mokedStartDate = date;
	}

	/**
	 * @param string
	 */
	public void setMonitAddress(String string) {
		monitAddress = string;
	}

	/**
	 * @param string
	 */
	public void setOptional1(String string) {
		optional1 = string;
	}

	/**
	 * @param string
	 */
	public void setOptional2(String string) {
		optional2 = string;
	}

	/**
	 * @param i
	 */
	public void setOrgUnitId(String i) {
		orgUnitId = i;
	}


	/**
	 * @param string
	 */
	public void setSocialStatus(String string) {
		socialStatus = string;
	}

	/**
	 * @param i
	 */
	public void setStatusId(int i) {
		statusId = i;
	}

	

	/**
	 * @param date
	 */
	public void setUpdateTime(Date date) {
		updateTime = date;
	}

	/**
	 * @param i
	 */
	public void setZipCode(int i) {
		zipCode = i;
	}

	

	

	

	

	/**
	 * @return
	 */
	public int getLocked() {
		return locked;
	}

	/**
	 * @return
	 */
	public int getTaxiAllowed() {
		return taxiAllowed;
	}

	/**
	 * @return
	 */
	public int getTrained() {
		return trained;
	}

	/**
	 * @param i
	 */
	public void setLocked(int i) {
		locked = i;
	}

	/**
	 * @param i
	 */
	public void setTaxiAllowed(int i) {
		taxiAllowed = i;
	}

	/**
	 * @param i
	 */
	public void setTrained(int i) {
		trained = i;
	}

	/**
	 * @return
	 */
	public String getPhoneCellular() {
		return phoneCellular;
	}

	/**
	 * @return
	 */
	public String getPhoneHome() {
		return phoneHome;
	}

	/**
	 * @return
	 */
	public String getPhoneWork() {
		return phoneWork;
	}

	/**
	 * @param string
	 */
	public void setPhoneCellular(String string) {
		phoneCellular = string;
	}

	/**
	 * @param string
	 */
	public void setPhoneHome(String string) {
		phoneHome = string;
	}

	/**
	 * @param string
	 */
	public void setPhoneWork(String string) {
		phoneWork = string;
	}

	/**
	 * @return
	 */
	public int getReplaceAllowed() {
		return replaceAllowed;
	}

	/**
	 * @param i
	 */
	public void setReplaceAllowed(int i) {
		replaceAllowed = i;
	}
	public int getWorkFromHome() {
		return workFromHome;
	}
	public void setWorkFromHome(int workFromHome) {
		this.workFromHome = workFromHome;
	}
	public String getJobName() {
		return jobName;
	}
	public void setJobName(String jobName) {
		this.jobName = jobName;
	}
	public String getReceiveSwitchSMS() {
		return receiveSwitchSMS;
	}
	public void setReceiveSwitchSMS(String receiveSwitchSMS) {
		this.receiveSwitchSMS = receiveSwitchSMS;
	}
	

}
