package bzq.shf.forms;

import bzq.shf.bean.UsageReportBean;

public class UsageReportForm extends UsageReportBean {

	protected String dateFrom;
	protected String dateTo;
	protected String moked;
	protected String innerJob[];
	protected String formAction;

	public String getDateFrom() {
		return dateFrom;
	}

	public void setDateFrom(String dateFrom) {
		this.dateFrom = dateFrom;
	}

	public String getDateTo() {
		return dateTo;
	}

	public void setDateTo(String dateTo) {
		this.dateTo = dateTo;
	}
	
	public String getMoked() {
		return moked;
	}

	public void setMoked(String moked) {
		this.moked = moked;
	}

	public String[] getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	public String getFormAction() {
		return formAction;
	}

	public void setFormAction(String formAction) {
		this.formAction = formAction;
	}

	public void copyForm(UsageReportForm other){
		this.dateFrom = other.getDateFrom();
		this.dateTo = other.getDateTo();
		this.moked = other.getMoked();
		this.innerJobId = other.getInnerJobId();
		this.formAction = other.getFormAction();
	}

}	// END CLASS
