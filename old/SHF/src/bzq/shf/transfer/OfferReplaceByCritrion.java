/*
 * Created on 11/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;
import java.util.Vector;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class OfferReplaceByCritrion extends ReplaceByCritrion {	
	private String status;
	private String offer;
	private Date offerStartTime;
	private Date offerEndTime;
	private String offerEmployeeId;
	private String offerEmployeeIdNum;
	private String employeeOrgUnit;
	private String offerFullName;
	private String offerManagerId;
	private String offerOrgUnitID;
	private String activity;
	private Vector<OfferReplaceByCritrion> offersToMe;
	private String note;
	
	static {
		fieldsMapping.put("STATUS","status");
		fieldsMapping.put("OFFER","offer");
		fieldsMapping.put("OFFERSTARTTIME","offerStartTime");
		fieldsMapping.put("OFFERENDTIME","offerEndTime");
		fieldsMapping.put("OFFEREMPLOYEEID","offerEmployeeId");
		fieldsMapping.put("OFFEREMPLOYEEIDNUM","offerEmployeeIdNum");
		fieldsMapping.put("OFFERFULLNAME","offerFullName");
		fieldsMapping.put("OFFERMANAGERID","offerManagerId");
		fieldsMapping.put("ORG_UNIT_ID","employeeOrgUnit");
		fieldsMapping.put("OFFERORGUNITID","offerOrgUnitID");
		fieldsMapping.put("NOTE","note");
	}
	 
	/**
	 * @return
	 */
	public String getOffer() {
		return offer;
	}

	/**
	 * @return
	 */
	public String getOfferEmployeeId() {
		return offerEmployeeId;
	}

	/**
	 * @return
	 */
	public String getOfferEmployeeIdNum() {
		return offerEmployeeIdNum;
	}

	/**
	 * @return
	 */
	public Date getOfferEndTime() {
		return offerEndTime;
	}

	/**
	 * @return
	 */
	public String getOfferFullName() {
		return offerFullName;
	}

	/**
	 * @return
	 */
	public String getOfferManagerId() {
		return offerManagerId;
	}

	/**
	 * @return
	 */
	public Date getOfferStartTime() {
		return offerStartTime;
	}

	/**
	 * @return
	 */
	public String getStatus() {
		return status;
	}


	/**
	 * @param string
	 */
	public void setOffer(String string) {
		offer = string;
	}

	/**
	 * @param string
	 */
	public void setOfferEmployeeId(String string) {
		offerEmployeeId = string;
	}

	/**
	 * @param string
	 */
	public void setOfferEmployeeIdNum(String string) {
		offerEmployeeIdNum = string;
	}

	/**
	 * @param string
	 */
	public void setOfferEndTime(Date date) {
		offerEndTime = date;
	}

	/**
	 * @param string
	 */
	public void setOfferFullName(String string) {
		offerFullName = string;
	}

	/**
	 * @param string
	 */
	public void setOfferManagerId(String string) {
		offerManagerId = string;
	}

	/**
	 * @param string
	 */
	public void setOfferStartTime(Date date) {
		offerStartTime = date;
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
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

	/**
	 * @return
	 */
	public String getActivity() {
		return activity;
	}

	/**
	 * @param map
	 */
	public static void setFieldsMapping(HashMap map) {
		fieldsMapping = map;
	}

	/**
	 * @param string
	 */
	public void setActivity(String string) {
		activity = string;
	}

	public String getEmployeeOrgUnit() {
		return employeeOrgUnit;
	}

	public void setEmployeeOrgUnit(String employeeOrgUnit) {
		this.employeeOrgUnit = employeeOrgUnit;
	}

	public Vector<OfferReplaceByCritrion> getOffersToMe() {
		return offersToMe;
	}

	public void setOffersToMe(Vector<OfferReplaceByCritrion> offersToMe) {
		this.offersToMe = offersToMe;
	}

	public void setOfferOrgUnitID(String offerOrgUnitID) {
		this.offerOrgUnitID = offerOrgUnitID;
	}

	public String getOfferOrgUnitID() {
		return offerOrgUnitID;
	}

	public void setNote(String note) {
		this.note = note;
	}

	public String getNote() {
		return note;
	}

	
}
