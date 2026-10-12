package bzq.shf.forms;

import java.util.HashMap;
import java.util.Vector;

import bzq.shf.bean.ShfBaseBean;

public class CTISearchCompletionForm extends ShfBaseBean{

	protected String id_number;
	protected String firstName;
	protected String lastName;
	protected String agaf;
	protected String moked;
	protected String job;
	protected String team;
	protected String activity;
	
	protected String completionCode;
	protected String completionStatus;
	protected String sourceSystem;
	protected String updatingUser;
	
	protected String completionFromDate;
	protected String completionFromTime;
	protected String completionToDate;
	protected String completionToTime;
	
	protected String actionCode;
	protected Vector<TableForm> users;
	protected Integer[] selectedCompletions;
	protected String[] completionsStart;
	protected String[] completionsEnd;
	protected String[] completionsCodes;
	protected String[] completionsStartDates;
	protected String[] completionsEndDates;
	
	public Integer[] getSelectedCompletions() {
		return selectedCompletions;
	}
	
	public String[] getCompletionsStartDates() {
		return completionsStartDates;
	}

	public void setCompletionsStartDates(String[] completionsStartDates) {
		this.completionsStartDates = completionsStartDates;
	}

	public String[] getCompletionsEndDates() {
		return completionsEndDates;
	}

	public void setCompletionsEndDates(String[] completionsEndDates) {
		this.completionsEndDates = completionsEndDates;
	}

	public String[] getCompletionsStart() {
		return completionsStart;
	}

	public void setCompletionsStart(String[] completionsStart) {
		this.completionsStart = completionsStart;
	}

	public String[] getCompletionsEnd() {
		return completionsEnd;
	}

	public void setCompletionsEnd(String[] completionsEnd) {
		this.completionsEnd = completionsEnd;
	}

	public String[] getCompletionsCodes() {
		return completionsCodes;
	}

	public void setCompletionsCodes(String[] completionsCodes) {
		this.completionsCodes = completionsCodes;
	}

	public void setSelectedCompletions(Integer[] selectedCompletions) {
		this.selectedCompletions = selectedCompletions;
	}

	public String getId_number() {
		return id_number;
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

	public Vector<TableForm> getUsers() {
		return users;
	}

	public void setUsers(Vector<TableForm> users) {
		this.users = users;
	}

	public String getActionCode() {
		return actionCode;
	}

	public void setActionCode(String actionCode) {
		this.actionCode = actionCode;
	}

	public String getActivity() {
		return activity;
	}

	public void setActivity(String activity) {
		this.activity = activity;
	}

	public void setId_number(String id_number) {
		this.id_number = id_number;
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

	public String getJob() {
		return job;
	}

	public void setJob(String job) {
		this.job = job;
	}

	public String getTeam() {
		return team;
	}

	public void setTeam(String team) {
		this.team = team;
	}

	public String getCompletionCode() {
		return completionCode;
	}

	public void setCompletionCode(String completionCode) {
		this.completionCode = completionCode;
	}

	public String getCompletionStatus() {
		return completionStatus;
	}

	public void setCompletionStatus(String completionStatus) {
		this.completionStatus = completionStatus;
	}

	public String getSourceSystem() {
		return sourceSystem;
	}
	
	public void setSourceSystem(String sourceSystem) {
		this.sourceSystem = sourceSystem;
	}

	public String getUpdatingUser() {
		return updatingUser;
	}

	public void setUpdatingUser(String updatingUser) {
		this.updatingUser = updatingUser;
	}

	public String getCompletionFromDate() {
		return completionFromDate;
	}

	public void setCompletionFromDate(String completionFromDate) {
		this.completionFromDate = completionFromDate;
	}

	public String getCompletionFromTime() {
		return completionFromTime;
	}

	public void setCompletionFromTime(String completionFromTime) {
		this.completionFromTime = completionFromTime;
	}

	public String getCompletionToDate() {
		return completionToDate;
	}

	public void setCompletionToDate(String completionToDate) {
		this.completionToDate = completionToDate;
	}

	public String getCompletionToTime() {
		return completionToTime;
	}

	public void setCompletionToTime(String completionToTime) {
		this.completionToTime = completionToTime;
	}

	@Override
	public HashMap getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}
	
}
