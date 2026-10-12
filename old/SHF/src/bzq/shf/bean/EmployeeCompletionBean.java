package bzq.shf.bean;

import java.util.Date;

public class EmployeeCompletionBean extends CompletionBean {
	
	static {
		fieldsMapping.put("COMPLETION_START","completionStart");
		fieldsMapping.put("COMPLETION_END","completionEnd");
		fieldsMapping.put("TEAM","team");
		fieldsMapping.put("EMPLOYEE_NAME","employeeName");
		fieldsMapping.put("USER_NAME","userName");
		fieldsMapping.put("SOURCE","source");
		fieldsMapping.put("ID","id");
		fieldsMapping.put("EMPLOYEE_ID","employeeIdNumber");
		fieldsMapping.put("SAP_STATUS","sapStatus");
	}
	
	protected Date completionStart;
	protected Date completionEnd;
	protected String team;
	protected String employeeName;
	protected String userName;
	protected String source;
	protected int id;
	protected String employeeIdNumber;
	protected int sapStatus;
	protected int employeeId;
	
	
	public int getEmployeeId() {
		return employeeId;
	}
	public void setEmployeeId(int employeeId) {
		this.employeeId = employeeId;
	}
	public String getEmployeeName() {
		return employeeName;
	}
	public void setEmployeeName(String employeeName) {
		this.employeeName = employeeName;
	}
	public Date getCompletionStart() {
		return completionStart;
	}
	public void setCompletionStart(Date completionStart) {
		this.completionStart = completionStart;
	}
	public Date getCompletionEnd() {
		return completionEnd;
	}
	public void setCompletionEnd(Date completionEnd) {
		this.completionEnd = completionEnd;
	}
	public String getTeam() {
		return team;
	}
	public void setTeam(String team) {
		this.team = team;
	}
	public String getUserName() {
		return userName;
	}
	public void setUserName(String userName) {
		this.userName = userName;
	}
	public String getSource() {
		return source;
	}
	public void setSource(String source) {
		this.source = source;
	}
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getEmployeeIdNumber() {
		return employeeIdNumber;
	}
	public void setEmployeeIdNumber(String employeeIdNumber) {
		this.employeeIdNumber = employeeIdNumber;
	}
	public int getSapStatus() {
		return sapStatus;
	}
	public void setSapStatus(int sapStatus) {
		this.sapStatus = sapStatus;
	}
	
	
	
}
