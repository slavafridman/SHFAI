package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class ExceptionSearchForm extends ShfBaseBean {
	
	protected String date;
	protected String timeFrom;
	protected String timeTo;
	protected String moked;
	protected String[] team;
	protected String[] activity;
	protected String[] innerJob;
	protected String[] exceptionCode;
	protected String[] timeoffCode;
	
	
	@Override
	public HashMap getFieldsMapping() {
		// TODO Auto-generated method stub
		return null;
	}


	public String[] getTimeoffCode() {
		return timeoffCode;
	}


	public void setTimeoffCode(String[] timeoffCode) {
		this.timeoffCode = timeoffCode;
	}


	public String getDate() {
		return date;
	}


	public void setDate(String date) {
		this.date = date;
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


	public String[] getTeam() {
		return team;
	}


	public void setTeam(String[] team) {
		this.team = team;
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


	public String[] getExceptionCode() {
		return exceptionCode;
	}


	public void setExceptionCode(String[] exceptionCode) {
		this.exceptionCode = exceptionCode;
	}
	
	public void copyForm(ExceptionSearchForm other){
		setActivity(other.getActivity());
		setMoked(other.getMoked());
		setTeam(other.getTeam());
		setInnerJob(other.getInnerJob());
		setExceptionCode(other.getExceptionCode());
		setDate(other.getDate());
		setTimeFrom(other.getTimeFrom());
		setTimeTo(other.getTimeTo());
		
	}
	
}
