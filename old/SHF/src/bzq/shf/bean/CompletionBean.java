package bzq.shf.bean;

import java.util.Date;
import bzq.shf.forms.TableForm;

public class CompletionBean extends TableForm{
	
	static {
		fieldsMapping.put("SAP_PAY","sapPay");
		fieldsMapping.put("UPDATE_DATE","updateDate");
		fieldsMapping.put("UPDATE_ID","updateId");
	}
	
	protected int sapPay;
	protected Date updateDate;
	protected String updateId;
	
	public int getSapPay() {
		return sapPay;
	}
	public void setSapPay(int sapPay) {
		this.sapPay = sapPay;
	}
	public Date getUpdateDate() {
		return updateDate;
	}
	public void setUpdateDate(Date updateDate) {
		this.updateDate = updateDate;
	}
	public String getUpdateId() {
		return updateId;
	}
	public void setUpdateId(String updateId) {
		this.updateId = updateId;
	}
}