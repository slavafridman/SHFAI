package bzq.shf.bean;

import java.util.HashMap;

import bzq.shf.forms.TableForm;

public class TimeoffBean extends TableForm {

	
	static {
		fieldsMapping.put("WM_SHORT_NAME","shortName");
		fieldsMapping.put("WM_SITE_ID","site");
		fieldsMapping.put("WM_PAID","paid");
		fieldsMapping.put("WM_HAS_LIMIT","hasLimit");
		fieldsMapping.put("WM_TRADE_RULE","tradeRule");
		
	}
	
	protected String shortName;
	protected int site;
	protected int paid;
	protected int hasLimit;
	protected int tradeRule;
	public String getShortName() {
		return shortName;
	}
	public void setShortName(String shortName) {
		this.shortName = shortName;
	}
	public int getSite() {
		return site;
	}
	public void setSite(int site) {
		this.site = site;
	}
	public int getPaid() {
		return paid;
	}
	public void setPaid(int paid) {
		this.paid = paid;
	}
	public int getHasLimit() {
		return hasLimit;
	}
	public void setHasLimit(int hasLimit) {
		this.hasLimit = hasLimit;
	}
	public int getTradeRule() {
		return tradeRule;
	}
	public void setTradeRule(int tradeRule) {
		this.tradeRule = tradeRule;
	}
	
	
	
}
