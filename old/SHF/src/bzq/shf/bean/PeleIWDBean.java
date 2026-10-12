package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

public class PeleIWDBean extends ShfBaseBean {
	
	protected static HashMap fieldsMapping = null;
	
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("MODULE_ID", "moduleId");
		fieldsMapping.put("MODULE_TITLE", "moduleTitle");		
		fieldsMapping.put("MODULE_TYPE", "moduleType");
		fieldsMapping.put("MODULE_OPEN_DATETIME", "moduleOpenDateTime");
		fieldsMapping.put("MODULE_CLOSE_DATETIME", "moduleCloseDateTime");
		fieldsMapping.put("MODULE_TIME_TO_COMPLETE", "moduleTimeToComplete");
		fieldsMapping.put("MODULE_LINK", "moduleLink");
		fieldsMapping.put("PARENT_ID", "parentId"); //
		fieldsMapping.put("EMP_ID", "empId");
		fieldsMapping.put("COMPLETION", "completion");
		fieldsMapping.put("IWD_TIMING", "iwdTiming");
		fieldsMapping.put("IWD_STATUS", "iwdStatus");
		fieldsMapping.put("SHF_EMPLOYEE_DAY_ID","empDayId");
		fieldsMapping.put("SHIFT_START_TIME","shiftStart");
		fieldsMapping.put("SHIFT_END_TIME","shiftEnd");
		fieldsMapping.put("FIRST_NAME", "firstName");
		fieldsMapping.put("LAST_NAME", "lastName");
		fieldsMapping.put("ORG_UNIT_ID", "orgUnitId");
		fieldsMapping.put("INNER_JOB_ID", "innerJobId");
		fieldsMapping.put("SHIFT_ENTRY", "shiftEntry");
		
	} 
	
	protected int moduleId;
	protected String moduleTitle;
	protected String moduleType;
	protected Date moduleOpenDateTime;
	protected Date moduleCloseDateTime;
	protected int moduleTimeToComplete;
	protected String moduleLink;
	protected String parentId;
	
	protected String empId;
	protected int completion;
	protected Date iwdTiming;
	protected int iwdStatus;
	protected String firstName;
	protected String lastName;
	protected String orgUnitId;
	protected int innerJobId;
	protected int shiftEntry;
	protected int empDayId;
	protected Date shiftStart;
	protected Date shiftEnd;
	
	protected int totalForModule;
	protected Vector <String> namesForModule;
	
	protected int completedForModule;
	protected Vector <String> namesCompletedForModule;
	protected int reqSentForModule;
	protected Vector <String> namesReqSentForModule;
	protected int schedForModule;
	protected Vector <String> namesSchedForModule;
	protected int notSchedForModule;
	protected Vector <String> namesNotSchedForModule;
	
	
	public Vector<String> getNamesForModule() {
		return namesForModule;
	}

	public void setNamesForModule(Vector<String> namesForModule) {
		this.namesForModule = namesForModule;
	}

	public Vector<String> getNamesCompletedForModule() {
		return namesCompletedForModule;
	}

	public void setNamesCompletedForModule(Vector<String> namesCompletedForModule) {
		this.namesCompletedForModule = namesCompletedForModule;
	}

	public Vector<String> getNamesReqSentForModule() {
		return namesReqSentForModule;
	}

	public void setNamesReqSentForModule(Vector<String> namesReqSentForModule) {
		this.namesReqSentForModule = namesReqSentForModule;
	}

	public Vector<String> getNamesSchedForModule() {
		return namesSchedForModule;
	}

	public void setNamesSchedForModule(Vector<String> namesSchedForModule) {
		this.namesSchedForModule = namesSchedForModule;
	}

	public Vector<String> getNamesNotSchedForModule() {
		return namesNotSchedForModule;
	}

	public void setNamesNotSchedForModule(Vector<String> namesNotSchedForModule) {
		this.namesNotSchedForModule = namesNotSchedForModule;
	}

	public int getModuleId() {
		return moduleId;
	}

	public void setModuleId(int moduleId) {
		this.moduleId = moduleId;
	}

	public String getModuleTitle() {
		return moduleTitle;
	}

	public void setModuleTitle(String moduleTitle) {
		this.moduleTitle = moduleTitle;
	}

	public String getModuleType() {
		return moduleType;
	}

	public void setModuleType(String moduleType) {
		this.moduleType = moduleType;
	}

	public Date getModuleOpenDateTime() {
		return moduleOpenDateTime;
	}

	public void setModuleOpenDateTime(Date moduleOpenDateTime) {
		this.moduleOpenDateTime = moduleOpenDateTime;
	}

	public Date getModuleCloseDateTime() {
		return moduleCloseDateTime;
	}

	public void setModuleCloseDateTime(Date moduleCloseDateTime) {
		this.moduleCloseDateTime = moduleCloseDateTime;
	}

	public int getModuleTimeToComplete() {
		return moduleTimeToComplete;
	}

	public void setModuleTimeToComplete(int moduleTimeToComplete) {
		this.moduleTimeToComplete = moduleTimeToComplete;
	}

	public String getModuleLink() {
		return moduleLink;
	}

	public void setModuleLink(String moduleLink) {
		this.moduleLink = moduleLink;
	}

	public String getEmpId() {
		return empId;
	}

	public void setEmpId(String empId) {
		this.empId = empId;
	}

	public int getCompletion() {
		return completion;
	}

	public void setCompletion(int completion) {
		this.completion = completion;
	}

	public Date getIwdTiming() {
		return iwdTiming;
	}

	public void setIwdTiming(Date iwdTiming) {
		this.iwdTiming = iwdTiming;
	}

	public int getIwdStatus() {
		return iwdStatus;
	}

	public void setIwdStatus(int iwdStatus) {
		this.iwdStatus = iwdStatus;
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

	public String getOrgUnitId() {
		return orgUnitId;
	}

	public void setOrgUnitId(String orgUnitId) {
		this.orgUnitId = orgUnitId;
	}

	public int getInnerJobId() {
		return innerJobId;
	}

	public void setInnerJobId(int innerJobId) {
		this.innerJobId = innerJobId;
	}

	@Override
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	public String getParentId() {
		return parentId;
	}

	public void setParentId(String parentId) {
		this.parentId = parentId;
	}

	public int getEmpDayId() {
		return empDayId;
	}

	public void setEmpDayId(int empDayId) {
		this.empDayId = empDayId;
	}

	public Date getShiftStart() {
		return shiftStart;
	}

	public void setShiftStart(Date shiftStart) {
		this.shiftStart = shiftStart;
	}

	public Date getShiftEnd() {
		return shiftEnd;
	}

	public void setShiftEnd(Date shiftEnd) {
		this.shiftEnd = shiftEnd;
	}

	public int getShiftEntry() {
		return shiftEntry;
	}

	public void setShiftEntry(int shiftEntry) {
		this.shiftEntry = shiftEntry;
	}

	public int getTotalForModule() {
		return totalForModule;
	}

	public void setTotalForModule(int totalForModule) {
		this.totalForModule = totalForModule;
	}

	public int getCompletedForModule() {
		return completedForModule;
	}

	public void setCompletedForModule(int completedForModule) {
		this.completedForModule = completedForModule;
	}

	public int getReqSentForModule() {
		return reqSentForModule;
	}

	public void setReqSentForModule(int reqSentForModule) {
		this.reqSentForModule = reqSentForModule;
	}

	public int getSchedForModule() {
		return schedForModule;
	}

	public void setSchedForModule(int schedForModule) {
		this.schedForModule = schedForModule;
	}

	public int getNotSchedForModule() {
		return notSchedForModule;
	}

	public void setNotSchedForModule(int notSchedForModule) {
		this.notSchedForModule = notSchedForModule;
	}

	public static void setFieldsMapping(HashMap fieldsMapping) {
		PeleIWDBean.fieldsMapping = fieldsMapping;
	}

}
