package bzq.shf.bean;

import java.util.Date;

import bzq.utils.BaseConvert;

public class ExceptionSearchBean extends ExceptionBean {
	
	static{
		fieldsMapping.put("EMPLOYEE_ID", "employeeId");
		fieldsMapping.put("FIRST_NAME", "firstName");
		fieldsMapping.put("LAST_NAME", "lastName");
		fieldsMapping.put("INNER_JOB", "innerJob");
		fieldsMapping.put("TEAM", "team");
		fieldsMapping.put("TIMEOFF_TYPE", "timeoffType");
		fieldsMapping.put("FULLDAY", "fullDay");
		fieldsMapping.put("EXCEPTION_TYPE_NAME","exceptionTypeName");
		
		fieldsMapping.put("JOB_NAME", "jobName");
		fieldsMapping.put("ORG_UNIT_NAME","orgUnitName");
		fieldsMapping.put("WM_SHIFT_START_DATETIME","wmShiftStartTime");
		fieldsMapping.put("WM_SHIFT_END_DATETIME","wmShiftEndTime");
		fieldsMapping.put("NEW_SHIFT_END","newShiftEnd");
		fieldsMapping.put("NEW_SHIFT_START","newShiftStart");
		fieldsMapping.put("WM_SCH_ACTIVITY_ID_DATA","wmActivityId");
		
	}
	
	protected int employeeId;
	protected String firstName;
	protected String lastName;
	protected String innerJob;
	protected String team;
	protected String timeoffType;
	protected int fullDay;
	protected String exceptionTypeName;
	protected String jobName;
	protected String orgUnitName;
	protected Date wmShiftStartTime;
	protected Date wmShiftEndTime;
	protected Date newShiftEnd;
	protected Date newShiftStart;
	
	//Svetlana
	protected String wmActivityId;

	public String getWmActivityId() {
		return wmActivityId;
	}
	public void setWmActivityId(String wmActivityId) {
		this.wmActivityId = wmActivityId;
	}
	
	public int getFullDay() {
		return fullDay;
	}
	public void setFullDay(int fullDay) {
		this.fullDay = fullDay;
	}
	public String getTimeoffType() {
		return timeoffType;
	}
	public void setTimeoffType(String timeoffType) {
		this.timeoffType = timeoffType;
	}
	public int getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(int employeeId) {
		this.employeeId = employeeId;
	}
	public String getFirstName() {
		return firstName;
	}
	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}
	public String getLastName() {
		return lastName;
	}
	public void setLastName(String lastName) {
		this.lastName = lastName;
	}
	public String getHTMLFullName(){
		return BaseConvert.specialCharactersHTML(firstName+" "+lastName, true, true);
	}
	public String getFullName(){
		return firstName+" "+lastName;
	}
	public String getInnerJob() {
		return innerJob;
	}
	public void setInnerJob(String innerJob) {
		this.innerJob = innerJob;
	}
	public String getTeam() {
		return team;
	}
	public void setTeam(String team) {
		this.team = team;
	}
	public String getExceptionTypeName() {
		return exceptionTypeName;
	}
	public void setExceptionTypeName(String exceptionTypeName) {
		this.exceptionTypeName = exceptionTypeName;
	}
	public String getJobName() {
		return jobName;
	}
	public void setJobName(String jobName) {
		this.jobName = jobName;
	}
	public String getOrgUnitName() {
		return orgUnitName;
	}
	public void setOrgUnitName(String orgUnitName) {
		this.orgUnitName = orgUnitName;
	}
	public Date getWmShiftStartTime() {
		return wmShiftStartTime;
	}
	public void setWmShiftStartTime(Date wmShiftStartTime) {
		this.wmShiftStartTime = wmShiftStartTime;
	}
	public Date getWmShiftEndTime() {
		return wmShiftEndTime;
	}
	public void setWmShiftEndTime(Date wmShiftEndTime) {
		this.wmShiftEndTime = wmShiftEndTime;
	}
	public Date getNewShiftEnd() {
		return newShiftEnd;
	}
	public void setNewShiftEnd(Date newShiftEnd) {
		this.newShiftEnd = newShiftEnd;
	}
	public Date getNewShiftStart() {
		return newShiftStart;
	}
	public void setNewShiftStart(Date newShiftStart) {
		this.newShiftStart = newShiftStart;
	}
	
	public Date getShiftEnd() {
		return newShiftEnd==null?wmShiftEndTime:newShiftEnd;
	}
	public Date getShiftStart() {
		return newShiftStart==null?wmShiftStartTime:newShiftStart;
	}
	
	
}
