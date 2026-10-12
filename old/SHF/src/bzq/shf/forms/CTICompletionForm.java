package bzq.shf.forms;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class CTICompletionForm extends ShfBaseBean{
	
	protected String first_name;
	protected String last_name;
	protected String id_number;
	protected String agaf;
	protected String moked;
	protected String job;
	protected String[] team;
	protected int statusId;
	protected String activity;
	protected String shiftDate;
	protected String shiftStartFrom;
	protected String shiftStartTo;
	protected String shiftEndFrom;
	protected String shiftEndTo;
	protected boolean personalData;
	protected boolean unitData;
	protected boolean shiftData;
	protected String allchecked;
	protected boolean byShiftStart;
	protected boolean byShiftEnd;
	protected boolean byShiftActivity;
	
	//completion set parameters
	protected String completionCode;
	protected String completionFromDate;
	protected String completionToDate;
	protected String completionStart;
	protected String completionEnd;
	protected Date start;
	protected Date end;
	
	protected Integer[] selectedEmployees;
	protected String[] completionsStart;
	protected String[] completionsEnd;
	
	protected String actionCode;
	
	protected String ctiAllowedMoked;
	
	
	
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
	public Integer[] getSelectedEmployees() {
		return selectedEmployees;
	}
	public void setSelectedEmployees(Integer[] selectedEmployees) {
		this.selectedEmployees = selectedEmployees;
	}
	public String getActionCode() {
		return actionCode;
	}
	public void setActionCode(String action) {
		this.actionCode = action;
	}
	public boolean isByShiftStart() {
		return byShiftStart;
	}
	public void setByShiftStart(boolean byShiftStart) {
		this.byShiftStart = byShiftStart;
	}
	public boolean isByShiftEnd() {
		return byShiftEnd;
	}
	public void setByShiftEnd(boolean byShiftEnd) {
		this.byShiftEnd = byShiftEnd;
	}
	public boolean isByShiftActivity() {
		return byShiftActivity;
	}
	public void setByShiftActivity(boolean byShiftActivity) {
		this.byShiftActivity = byShiftActivity;
	}
	public int getStatusId() {
		return statusId;
	}
	public void setStatusId(int statusId) {
		this.statusId = statusId;
	}
	public String getAgaf() {
		return agaf;
	}
	public void setAgaf(String agaf) {
		this.agaf = agaf;
	}
	public Date getStart() {
		return start;
	}
	public void setStart(Date start) {
		this.start = start;
	}
	public Date getEnd() {
		return end;
	}
	public void setEnd(Date end) {
		this.end = end;
	}
	public String getCompletionCode() {
		return completionCode;
	}
	public void setCompletionCode(String completionCode) {
		this.completionCode = completionCode;
	}
	public String getCompletionStart() {
		return completionStart;
	}
	public void setCompletionStart(String completionStart) {
		this.completionStart = completionStart;
	}
	public String getCompletionEnd() {
		return completionEnd;
	}
	public void setCompletionEnd(String completionEnd) {
		this.completionEnd = completionEnd;
	}
	public String getAllchecked() {
		return allchecked;
	}
	public void setAllchecked(String allchecked) {
		this.allchecked = allchecked;
	}
	public boolean isUnitData() {
		return unitData;
	}
	public void setUnitData(boolean unitData) {
		this.unitData = unitData;
	}
	public boolean isShiftData() {
		return shiftData;
	}
	public void setShiftData(boolean shiftData) {
		this.shiftData = shiftData;
	}
	public boolean isPersonalData() {
		return personalData;
	}
	public void setPersonalData(boolean personalData) {
		this.personalData = personalData;
	}
	
	public String getShiftDate() {
		return shiftDate;
	}
	public void setShiftDate(String shiftDate) {
		this.shiftDate = shiftDate;
	}
	public String getFirst_name() {
		return first_name;
	}
	public void setFirst_name(String first_name) {
		this.first_name = first_name;
	}
	public String getLast_name() {
		return last_name;
	}
	public void setLast_name(String last_name) {
		this.last_name = last_name;
	}
	public String getId_number() {
		return id_number;
	}
	public void setId_number(String id_number) {
		this.id_number = id_number;
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
	public String[] getTeam() {
		return team;
	}
	public void setTeam(String[] team) {
		this.team = team;
	}
	public String getActivity() {
		return activity;
	}
	public void setActivity(String activity) {
		this.activity = activity;
	}
	@Override
	public HashMap getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}
	public String getCompletionFromDate() {
		return completionFromDate;
	}
	public void setCompletionFromDate(String completionFromDate) {
		this.completionFromDate = completionFromDate;
	}
	public String getCompletionToDate() {
		return completionToDate;
	}
	public void setCompletionToDate(String completionToDate) {
		this.completionToDate = completionToDate;
	}
	public String getShiftStartFrom() {
		return shiftStartFrom;
	}
	public void setShiftStartFrom(String shiftStartFrom) {
		this.shiftStartFrom = shiftStartFrom;
	}
	public String getShiftStartTo() {
		return shiftStartTo;
	}
	public void setShiftStartTo(String shiftStartTo) {
		this.shiftStartTo = shiftStartTo;
	}
	public String getShiftEndFrom() {
		return shiftEndFrom;
	}
	public void setShiftEndFrom(String shiftEndFrom) {
		this.shiftEndFrom = shiftEndFrom;
	}
	public String getShiftEndTo() {
		return shiftEndTo;
	}
	public void setShiftEndTo(String shiftEndTo) {
		this.shiftEndTo = shiftEndTo;
	}
	public String getCtiAllowedMoked() {
		return ctiAllowedMoked;
	}
	public void setCtiAllowedMoked(String ctiAllowedMoked) {
		this.ctiAllowedMoked = ctiAllowedMoked;
	}

	
}
