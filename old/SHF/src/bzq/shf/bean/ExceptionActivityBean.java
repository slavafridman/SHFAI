/*
 * Created on 05/04/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.HashMap;

import bzq.shf.forms.TableForm;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ExceptionActivityBean extends TableForm {

	
	static {
		fieldsMapping.put("EXCEPTION_TYPE_ID","exceptionCode");
		fieldsMapping.put("SITE_ID","siteId");
		fieldsMapping.put("SHORT_NAME","shortName");
		fieldsMapping.put("FULL_DAY","fullDay");
		fieldsMapping.put("ONSITE","onSite");
		fieldsMapping.put("PAID","paid");
		fieldsMapping.put("CONVERTABLE_TO_DAYOFF","convertable");
		fieldsMapping.put("USED_AS_VACATION","usedAsVacation");
		fieldsMapping.put("USED_IN_MEETING","usedInMeeting");
		fieldsMapping.put("OPTIONAL1","optional1");
		fieldsMapping.put("OPTIONAL2","optional2");
		fieldsMapping.put("SPLIT_SHIFT","splitShift");
		
	}
	protected long exceptionCode;
	protected String siteId;
	protected String shortName;
	protected boolean fullDay;
	protected boolean onSite;
	protected boolean paid;
	protected boolean convertable;
	protected boolean usedAsVacation;
	protected boolean usedInMeeting;
	protected String optional1;
	protected String optional2;
	protected String splitShift;
	
	
	public long getExceptionCode() {
		return exceptionCode;
	}

	public void setExceptionCode(long exceptionCode) {
		this.exceptionCode = exceptionCode;
	}

	/**
	 * @return
	 */
	public boolean isConvertable() {
		return convertable;
	}

	/**
	 * @return
	 */
	public boolean isFullDay() {
		return fullDay;
	}

	/**
	 * @return
	 */
	public boolean isOnSite() {
		return onSite;
	}

	/**
	 * @return
	 */
	public String getOptional1() {
		return optional1;
	}

	/**
	 * @return
	 */
	public String getOptional2() {
		return optional2;
	}

	/**
	 * @return
	 */
	public boolean isPaid() {
		return paid;
	}

	/**
	 * @return
	 */
	public String getShortName() {
		return shortName;
	}

	/**
	 * @return
	 */
	public String getSiteId() {
		return siteId;
	}

	/**
	 * @return
	 */
	public boolean isUsedAsVacation() {
		return usedAsVacation;
	}

	/**
	 * @return
	 */
	public boolean isUsedInMeeting() {
		return usedInMeeting;
	}

	/**
	 * @param b
	 */
	public void setConvertable(boolean b) {
		convertable = b;
	}

	/**
	 * @param b
	 */
	public void setFullDay(boolean b) {
		fullDay = b;
	}

	/**
	 * @param b
	 */
	public void setOnSite(boolean b) {
		onSite = b;
	}

	/**
	 * @param string
	 */
	public void setOptional1(String string) {
		optional1 = string;
	}

	/**
	 * @param string
	 */
	public void setOptional2(String string) {
		optional2 = string;
	}

	/**
	 * @param b
	 */
	public void setPaid(boolean b) {
		paid = b;
	}

	/**
	 * @param string
	 */
	public void setShortName(String string) {
		shortName = string;
	}

	/**
	 * @param string
	 */
	public void setSiteId(String string) {
		siteId = string;
	}

	/**
	 * @param b
	 */
	public void setUsedAsVacation(boolean b) {
		usedAsVacation = b;
	}

	/**
	 * @param b
	 */
	public void setUsedInMeeting(boolean b) {
		usedInMeeting = b;
	}

	public String getSplitShift() {
		return splitShift;
	}

	public void setSplitShift(String splitShift) {
		this.splitShift = splitShift;
	}
	
	public boolean isSplitShiftType() {
		return this.splitShift != null ? ("y".equalsIgnoreCase(this.splitShift) ? true : false) : false;
	}
}
