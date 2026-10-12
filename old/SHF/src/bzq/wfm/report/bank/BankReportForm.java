package bzq.wfm.report.bank;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

public class BankReportForm extends ShfBaseBean{
	
	
	protected String fromDate;
	
	protected String toDate;
	
	protected String agaf;
	
	protected String moked;
	
	protected String[] innerJob;
	
	

	public String getFromDate() {
		return fromDate;
	}

	public void setFromDate(String fromDate) {
		this.fromDate = fromDate;
	}

	public String getToDate() {
		return toDate;
	}

	public void setToDate(String toDate) {
		this.toDate = toDate;
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

	public String[] getInnerJob() {
		return innerJob;
	}

	public void setInnerJob(String[] innerJob) {
		this.innerJob = innerJob;
	}

	@Override
	public HashMap getFieldsMapping() {
		return null;
	}
	
	

}
