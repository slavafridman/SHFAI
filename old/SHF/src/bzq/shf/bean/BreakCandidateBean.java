/*
 * Created on 29/03/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BreakCandidateBean extends BreakBean{

static {
	
	fieldsMapping.put("SHF_EMPLOYEE_DAY_ID","employeeDayId");
	fieldsMapping.put("BREAK_START","breakStart");
	fieldsMapping.put("CREATION_DATE","creationDate");
	fieldsMapping.put("STATUS","status");
	fieldsMapping.put("ERR_REASON","errReason");
	fieldsMapping.put("MODIFIED_DATE","modifiedDate");
	fieldsMapping.put("OFFER_DAY_ID","offerDayId");
	fieldsMapping.put("OFFER_START_DATE","offerStartDate");
	fieldsMapping.put("OFFER_ORG_UNIT_ID","offerOrgUnitId");
	fieldsMapping.put("OFFER_EMP_ID_NUMBER","offerEmpIdNumber");

	}
public 	BreakCandidateBean (){
	super();
}
	protected long employeeDayId;
	protected Date breakStart;
	protected Date creationDate;
	protected String status;
	protected String errReason;
	protected Date modifiedDate;
	protected long offerDayId;
	protected Date offerStartDate; 
	protected BreakCandidateBean offerCaDetails;
	protected String offerOrgUnitId;
	protected String offerEmpIdNumber;
			
	
	/**
	 * @return
	 */
	public Date getBreakStart() {
		return breakStart;
	}

	/**
	 * @return
	 */
	public Date getCreationDate() {
		return creationDate;
	}

	/**
	 * @return
	 */
	public long getEmployeeDayId() {
		return employeeDayId;
	}

	/**
	 * @return
	 */
	public String getErrReason() {
		return errReason;
	}

	/**
	 * @return
	 */
	public Date getModifiedDate() {
		return modifiedDate;
	}

	/**
	 * @return
	 */
	public String getStatus() {
		return status;
	}

/**
 * @param map
 */
public static void setFieldsMapping(HashMap map) {
	fieldsMapping = map;
}

	/**
	 * @param date
	 */
	public void setBreakStart(Date date) {
		breakStart = date;
	}

	/**
	 * @param date
	 */
	public void setCreationDate(Date date) {
		creationDate = date;
	}

	/**
	 * @param l
	 */
	public void setEmployeeDayId(long l) {
		employeeDayId = l;
	}

	/**
	 * @param string
	 */
	public void setErrReason(String string) {
		errReason = string;
	}

	/**
	 * @param date
	 */
	public void setModifiedDate(Date date) {
		modifiedDate = date;
	}

	/**
	 * @param string
	 */
	public void setStatus(String string) {
		status = string;
	}

	/**
	 * @return
	 */
	public long getOfferDayId() {
		return offerDayId;
	}

	/**
	 * @return
	 */
	public Date getOfferStartDate() {
		return offerStartDate;
	}

	/**
	 * @param l
	 */
	public void setOfferDayId(long l) {
		offerDayId = l;
	}

	/**
	 * @param date
	 */
	public void setOfferStartDate(Date date) {
		offerStartDate = date;
	}


	/**
	 * @return
	 */
	public BreakCandidateBean getOfferCaDetails() {
		return offerCaDetails;
	}

	/**
	 * @param bean
	 */
	public void setOfferCaDetails(BreakCandidateBean bean) {
		offerCaDetails = bean;
	}

	public String getOfferOrgUnitId() {
		return offerOrgUnitId;
	}

	public void setOfferOrgUnitId(String offerOrgUnitId) {
		this.offerOrgUnitId = offerOrgUnitId;
	}

	public String getOfferEmpIdNumber() {
		return offerEmpIdNumber;
	}

	public void setOfferEmpIdNumber(String offerEmpIdNumber) {
		this.offerEmpIdNumber = offerEmpIdNumber;
	}

}
