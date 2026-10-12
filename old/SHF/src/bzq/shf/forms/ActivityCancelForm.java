package bzq.shf.forms;

import java.util.Date;

public class ActivityCancelForm extends  AttendanceDataForm{
	
	
	protected String timeFrom;
	protected String timeTo;
	protected String moked;
	protected String[] activity;
	protected String[] innerJob;
	protected String[] team;
	protected String[] exceptionCode;
	protected String[] eventReasonCode;
	
	
	public ActivityCancelForm(){
		super();
	}
	
	public String getTimeFrom() {
		return timeFrom;
	}
	public void setTimeFrom(String timeFrom) {
		this.timeFrom = timeFrom;
	}
	public String getTimeTo() {
		return timeTo;
	}
	public void setTimeTo(String timeTo) {
		this.timeTo = timeTo;
	}
	public String getMoked() {
		return moked;
	}
	public void setMoked(String moked) {
		this.moked = moked;
	}
	public String[] getActivity() {
		return activity;
	}
	public void setActivity(String[] activity) {
		this.activity = activity;
	}
	public String[] getInnerJob() {
		return innerJob;
	}
	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}
	public String[] getTeam() {
		return team;
	}
	public void setTeam(String[] team) {
		this.team = team;
	}
	public String[] getExceptionCode() {
		return exceptionCode;
	}
	public void setExceptionCode(String[] exceptionCode) {
		this.exceptionCode = exceptionCode;
	}
	public String[] getEventReasonCode() {
		return eventReasonCode;
	}
	public void setEventReasonCode(String[] eventReasonCode) {
		this.eventReasonCode = eventReasonCode;
	}

	public void copyForm(ActivityCancelForm other){
		this.date=other.getDate(); 
		this.timeFrom=other.getTimeFrom();
		this.timeTo=other.getTimeTo();
		this.moked=other.getMoked();
		this.activity=other.getActivity();
		this.innerJob=other.getInnerJob();
		this.team=other.getTeam();
		this.exceptionCode=other.getExceptionCode();
		this.eventReasonCode=other.getEventReasonCode();
	}
}
