/*
 * Created on 22/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.transfer;

import java.util.Date;
import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceMassage extends ShfBaseBean{

private int id;
private int empId;
private String note; 
private String subject;
private String text;
private Date creationDate;
private String isRead;
private String msgType;
private int shiftId;
private Date shiftStart;
private Date shiftEnd;
private int offerShiftId;
private Date offerShiftStart;
private Date offerShiftEnd;
private int offerEmployeeId;
private String offerFullName;
private String isDeleted;
private String selectedRows;

protected static HashMap fieldsMapping = null;
static {
	fieldsMapping = new HashMap();
	fieldsMapping.put("ID", "id");
	fieldsMapping.put("EMPLOYEE_ID", "empId");
	fieldsMapping.put("NOTE", "note");
	fieldsMapping.put("SUBJECT", "subject");
	fieldsMapping.put("TEXT","text");
	fieldsMapping.put("CREATION_DATE","creationDate");
	fieldsMapping.put("IS_READ","isRead");
	fieldsMapping.put("MSG_TYPE","msgType");
	fieldsMapping.put("SHIFT_ID","shiftId");
	fieldsMapping.put("SHIFT_START","shiftStart");
	fieldsMapping.put("SHIFT_END","shiftEnd");
	fieldsMapping.put("OFFER_SHIFT_ID","offerShiftId");
	fieldsMapping.put("OFFER_SHIFT_START","offerShiftStart");
	fieldsMapping.put("OFFER_SHIFT_END","offerShiftEnd");
	fieldsMapping.put("OFFER_EMLOYEE_ID","offerEmployeeId");
	fieldsMapping.put("OFFER_FULL_NAME","offerFullName");
	fieldsMapping.put("IS_DELETED","isDeleted");
	
}
/**
 * @return
 */
public int getEmpId() {
	return empId;
}

/**
 * @return
 */
public String getNote() {
	return note;
}

/**
 * @return
 */
public String getSubject() {
	return subject;
}

/**
 * @return
 */
public String getText() {
	return text;
}

/**
 * @param i
 */
public void setEmpId(int i) {
	empId = i;
}

/**
 * @param string
 */
public void setNote(String string) {
	note = string;
}

/**
 * @param string
 */
public void setSubject(String string) {
	subject = string;
}

/**
 * @param string
 */
public void setText(String string) {
	text = string;
}

/**
 * @return
 */
public Date getCreationDate() {
	return creationDate;
}

/**
 * @param string
 */
public void setCreationDate(Date date) {
	creationDate = date;
}

/**
 * @return
 */
public int getId() {
	return id;
}

/**
 * @param i
 */
public void setId(int i) {
	id = i;
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
public String getIsRead() {
	return isRead;
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
public void setIsRead(String string) {
	isRead = string;
}

public void setMsgType(String msgType) {
	this.msgType = msgType;
}

public String getMsgType() {
	return msgType;
}

public void setShiftStart(Date shiftStart) {
	this.shiftStart = shiftStart;
}

public Date getShiftStart() {
	return shiftStart;
}

public void setShiftEnd(Date shiftEnd) {
	this.shiftEnd = shiftEnd;
}

public Date getShiftEnd() {
	return shiftEnd;
}

public void setShiftId(int shiftId) {
	this.shiftId = shiftId;
}

public int getShiftId() {
	return shiftId;
}

public void setOfferShiftId(int offerShiftId) {
	this.offerShiftId = offerShiftId;
}

public int getOfferShiftId() {
	return offerShiftId;
}

public void setOfferShiftStart(Date offerShiftStart) {
	this.offerShiftStart = offerShiftStart;
}

public Date getOfferShiftStart() {
	return offerShiftStart;
}

public void setOfferShiftEnd(Date offerShiftEnd) {
	this.offerShiftEnd = offerShiftEnd;
}

public Date getOfferShiftEnd() {
	return offerShiftEnd;
}

public void setOfferEmployeeId(int offerEmployeeId) {
	this.offerEmployeeId = offerEmployeeId;
}

public int getOfferEmployeeId() {
	return offerEmployeeId;
}

public void setOfferFullName(String offerFullName) {
	this.offerFullName = offerFullName;
}

public String getOfferFullName() {
	return offerFullName;
}

public void setSelectedRows(String selectedRows) {
	this.selectedRows = selectedRows;
}

public String getSelectedRows() {
	return selectedRows;
}

}
