package bzq.wfm.report;

import java.util.Date;

public class HRData {
	
	protected String agaf;
	protected String moked;
	protected String team;
	protected String idnum;
	protected String empName;
	protected String sapStatus;
	protected String sapJob;
	protected String innerJob;
	protected String sapJobTime;
	protected String contractName;
	protected Date sapStartDate;
	protected Date wfmStartDate;
	protected Date wfmTerminationDate;
	protected int weekMinMinutes;
	protected int weekMaxMinutes;

	public String[] skillsFlag;
	public int[] activitiesFlag;
	
	public HRData() {
		//activities=new ArrayList<Integer>();
		//skills=new ArrayList<Integer>();
	}

	public String getAgaf() {
		return agaf;
	}

	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}

	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}

	public String getTeam() {
		return team;
	}

	public void setTeam(String team) {
		this.team = team;
	}

	public String getIdnum() {
		return idnum;
	}

	public void setIdnum(String idnum) {
		this.idnum = idnum;
	}

	public String getEmpName() {
		return empName;
	}

	public void setEmpName(String empName) {
		this.empName = empName;
	}

	public String getSapStatus() {
		return sapStatus;
	}

	public void setSapStatus(String sapStatus) {
		this.sapStatus = sapStatus;
	}

	public String getSapJob() {
		return sapJob;
	}

	public void setSapJob(String sapJob) {
		this.sapJob = sapJob;
	}

	public String getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String innerJob) {
		this.innerJob = innerJob;
	}

	public String getSapJobTime() {
		return sapJobTime;
	}

	public void setSapJobTime(String sapJobTime) {
		this.sapJobTime = sapJobTime;
	}

	public String getContractName() {
		return contractName;
	}

	public void setContractName(String contractName) {
		this.contractName = contractName;
	}

	public Date getSapStartDate() {
		return sapStartDate;
	}

	public void setSapStartDate(Date sapStartDate) {
		this.sapStartDate = sapStartDate;
	}

	public Date getWfmStartDate() {
		return wfmStartDate;
	}

	public void setWfmStartDate(Date wfmStartDate) {
		this.wfmStartDate = wfmStartDate;
	}

	public Date getWfmTerminationDate() {
		return wfmTerminationDate;
	}

	public void setWfmTerminationDate(Date wfmTerminationDate) {
		this.wfmTerminationDate = wfmTerminationDate;
	}

	public int getWeekMinMinutes() {
		return weekMinMinutes;
	}

	public void setWeekMinMinutes(int weekMinMinutes) {
		this.weekMinMinutes = weekMinMinutes;
	}

	public int getWeekMaxMinutes() {
		return weekMaxMinutes;
	}

	public void setWeekMaxMinutes(int weekMaxMinutes) {
		this.weekMaxMinutes = weekMaxMinutes;
	}

	/*
	public ArrayList<Integer> getSkills() {
		return skills;
	}

	

	public ArrayList<Integer> getActivities() {
		return activities;
	}

	public void setActivities(ArrayList<Integer> activities) {
		this.activities = activities;
	}

	public void addSkillValue(int val) {
		skills.add(val);
	}

	public void addActivityValue(int val) {
		activities.add(val);
		
	}
	*/
	

}
