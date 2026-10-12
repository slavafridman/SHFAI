package bzq.beans;

import java.util.Date;
import java.util.HashMap;

public class TransactionBean extends bzq.forms.BaseForm {
	
	protected static HashMap fieldsMapping = null;
	static {
		fieldsMapping = new HashMap();
		fieldsMapping.put("ID", "id");
		fieldsMapping.put("TRANSACTION_ID", "transactionId");
		fieldsMapping.put("PROCESS_ID", "processId");
		fieldsMapping.put("SOURCE", "source");
		fieldsMapping.put("DESTINATION", "destination");
		fieldsMapping.put("CREATION_DATE", "creationDate");
		fieldsMapping.put("UPDATE_DATE", "updateDate");
		fieldsMapping.put("EMPLOYEE_ID", "employeeId");
		fieldsMapping.put("XML_REQUEST", "xmlRequest");
		fieldsMapping.put("XML_RESPONSE", "xmlResponse");
		fieldsMapping.put("STATUS", "status");
		fieldsMapping.put("STATUS_DESCRIPTION", "statusDescription");
	}
	
	private long id;
	private long transactionId;
	private int processId;
	private String source;
	private String destination;
	private Date creationDate;
	private Date updateDate;
	private String employeeId;
	private String xmlRequest;
	private String xmlResponse;
	private int status;
	private String statusDescription;
	
	

	public long getId() {
		return id;
	}



	public void setId(long id) {
		this.id = id;
	}



	public long getTransactionId() {
		return transactionId;
	}



	public void setTransactionId(long transactionId) {
		this.transactionId = transactionId;
	}



	public int getProcessId() {
		return processId;
	}



	public void setProcessId(int processId) {
		this.processId = processId;
	}



	public String getSource() {
		return source;
	}



	public void setSource(String source) {
		this.source = source;
	}



	public String getDestination() {
		return destination;
	}



	public void setDestination(String destination) {
		this.destination = destination;
	}



	public Date getCreationDate() {
		return creationDate;
	}



	public void setCreationDate(Date creationDate) {
		this.creationDate = creationDate;
	}



	public Date getUpdateDate() {
		return updateDate;
	}



	public void setUpdateDate(Date updateDate) {
		this.updateDate = updateDate;
	}



	public String getEmployeeId() {
		return employeeId;
	}



	public void setEmployeeId(String employeeId) {
		this.employeeId = employeeId;
	}



	public String getXmlRequest() {
		return xmlRequest;
	}



	public void setXmlRequest(String xmlRequest) {
		this.xmlRequest = xmlRequest;
	}



	public String getXmlResponse() {
		return xmlResponse;
	}



	public void setXmlResponse(String xmlResponse) {
		this.xmlResponse = xmlResponse;
	}



	public int getStatus() {
		return status;
	}



	public void setStatus(int status) {
		this.status = status;
	}



	public String getStatusDescription() {
		return statusDescription;
	}



	public void setStatusDescription(String statusDescription) {
		this.statusDescription = statusDescription;
	}



	public static void setFieldsMapping(HashMap fieldsMapping) {
		TransactionBean.fieldsMapping = fieldsMapping;
	}
	


	@Override
	public HashMap getFieldsMapping() {
		return fieldsMapping;
	}

}
