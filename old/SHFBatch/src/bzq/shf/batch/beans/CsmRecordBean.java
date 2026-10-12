package bzq.shf.batch.beans;

/**
 * Insert the type's description here.
 * Creation date: (08/03/2004 11:22:24)
 * @author: Slava Fridman
 */
public class CsmRecordBean {
	public final static String RECORD_ID= "D";
	private String subscriberId;
	private java.lang.String areaCode;
	private java.lang.Integer phoneNumber;
	private java.lang.String subscriberStatus;
	private java.lang.String unpublishedSing;
	public final static java.lang.String FILLER="                    ";
	private int statusDay;
	private int statusMonth;
	private int statusYear;
	private java.lang.String sourceUnpublishedSing;
/**
 * CsmRecordBean constructor comment.
 */
public CsmRecordBean() {
	super();
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:27:34)
 * @return java.lang.String
 */
public java.lang.String getAreaCode() {
	return areaCode;
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:28:09)
 * @return java.lang.Integer
 */
public java.lang.Integer getPhoneNumber() {
	return phoneNumber;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:26:58)
 * @return java.lang.String
 */
public java.lang.String getSourceUnpublishedSing() {
	return sourceUnpublishedSing;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:25:01)
 * @return int
 */
public int getStatusDay() {
	return statusDay;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:25:43)
 * @return int
 */
public int getStatusMonth() {
	return statusMonth;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:26:11)
 * @return int
 */
public int getStatusYear() {
	return statusYear;
}
/**
 * Insert the method's description here.
 * Creation date: (09/03/2004 12:21:03)
 * @return java.lang.String
 */
public java.lang.String getSubscriberId() {
	return subscriberId;
}
/**
 * Insert the method's description here.
 * Creation date: (17/06/2004 15:33:13)
 * @return java.lang.String
 */
public java.lang.String getSubscriberStatus() {
	return subscriberStatus;
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:29:50)
 * @return java.lang.String
 */
public java.lang.String getUnpublishedSing() {
	return unpublishedSing;
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:27:34)
 * @param newAreaCode java.lang.String
 */
public void setAreaCode(java.lang.String newAreaCode) {
	areaCode = newAreaCode;
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:28:09)
 * @param newPhoneNumber java.lang.Integer
 */
public void setPhoneNumber(java.lang.Integer newPhoneNumber) {
	phoneNumber = newPhoneNumber;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:26:58)
 * @param newSourceUnpublishedSing java.lang.String
 */
public void setSourceUnpublishedSing(java.lang.String newSourceUnpublishedSing) {
	sourceUnpublishedSing = newSourceUnpublishedSing;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:25:01)
 * @param newStatusDay int
 */
public void setStatusDay(int newStatusDay) {
	statusDay = newStatusDay;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:25:43)
 * @param newStatusMonth int
 */
public void setStatusMonth(int newStatusMonth) {
	statusMonth = newStatusMonth;
}
/**
 * Insert the method's description here.
 * Creation date: (24/06/2004 13:26:11)
 * @param newStatusYear int
 */
public void setStatusYear(int newStatusYear) {
	statusYear = newStatusYear;
}
/**
 * Insert the method's description here.
 * Creation date: (09/03/2004 12:21:03)
 * @param newSubscriberId java.lang.String
 */
public void setSubscriberId(java.lang.String newSubscriberId) {
	subscriberId = newSubscriberId;
}
/**
 * Insert the method's description here.
 * Creation date: (17/06/2004 15:33:13)
 * @param newSubscriberStatus java.lang.String
 */
public void setSubscriberStatus(java.lang.String newSubscriberStatus) {
	subscriberStatus = newSubscriberStatus;
}
/**
 * Insert the method's description here.
 * Creation date: (08/03/2004 11:29:50)
 * @param newUnpublishedSing java.lang.String
 */
public void setUnpublishedSing(java.lang.String newUnpublishedSing) {
	unpublishedSing = newUnpublishedSing;
}
}
