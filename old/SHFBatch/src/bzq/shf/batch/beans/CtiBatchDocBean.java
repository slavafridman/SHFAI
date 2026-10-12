package bzq.shf.batch.beans;

import java.util.Date;
import java.util.HashMap;
/**
 * Insert the type's description here.
 * Creation date: (05/11/2002 15:50:47)
 * @author: Natana Cohen
 */
public class CtiBatchDocBean  extends bzq.forms.BaseForm {
// TODO : change to Cti doc table
protected static HashMap fieldsMappping= null;
 static {
            	fieldsMappping = new HashMap();
        		fieldsMappping.put("PROCESS_DOC_KEY","processDocKey");
            	fieldsMappping.put("PROCESS_KEY","processKey");
            	fieldsMappping.put("EXEC_DATE","executionDate");
             	fieldsMappping.put("TRIGGER_DATE","triggerDate");
             	fieldsMappping.put("GEN_NUMBER","generationNumber");
            	fieldsMappping.put("REC_SCANED","recordsScanned");
            	fieldsMappping.put("REC_ADDED","recordsAdded");
              	fieldsMappping.put("REC_MODIFIED","recordsModified");
              	fieldsMappping.put("REC_DELETED","recordsDeleted");
              	fieldsMappping.put("REC_INVALID","recordsInvalid");
            	fieldsMappping.put("PROCESS_STATUS","processStatus");
             	fieldsMappping.put("OPERATION_PRM","operationPrm");
             	fieldsMappping.put("LAST_COMMIT_REC","lastCommitRecord");
             	fieldsMappping.put("STEP_IN_PROGRESS","stepInProgress");
             	fieldsMappping.put("FILE_NAME","fileName");
             	fieldsMappping.put("SOURCE_KEY","sourceKey");
             	fieldsMappping.put("DOC_DESC","docDesc"); 
             	fieldsMappping.put("PROCESS_DESC","processDescription");// For daily report S.F.		
             	
     }           	
   
    private Long    processDocKey;
    private Integer processKey;
    private Date executionDate;
    private Date triggerDate;
    private Integer   generationNumber;
    private Integer   recordsScanned=new Integer(0);
    private Integer   recordsAdded=new Integer(0);
    private Integer   recordsModified=new Integer(0);
    private Integer   recordsDeleted=new Integer(0);
    private Integer   recordsInvalid=new Integer(0);
    private String  processStatus;
    private String  operationPrm;
    private Integer   lastCommitRecord;
    private String stepInProgress;
    private String  fileName;
    private Integer sourceKey;
    private String docDesc;
    private String processDescription;// For daily report S.F.
     
    
/**
 * Insert the method's description here.
 * Creation date: (13/04/2003 10:33:08)
 */
public CtiBatchDocBean() {
	super();
	
	}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.String
 */
public java.lang.String getDocDesc() {
	return docDesc;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.util.Date
 */
public java.util.Date getExecutionDate() {
	return executionDate;
}
public  java.util.HashMap getFieldsMapping() {
  return fieldsMappping;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.String
 */
public java.lang.String getFileName() {
	return fileName;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getGenerationNumber() {
	return generationNumber;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getLastCommitRecord() {
	return lastCommitRecord;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.String
 */
public java.lang.String getOperationPrm() {
	return operationPrm;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Long
 */
public java.lang.Long getProcessDocKey() {
	return processDocKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getProcessKey() {
	return processKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.String
 */
public java.lang.String getProcessStatus() {
	return processStatus;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getRecordsAdded() {
	return recordsAdded;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getRecordsDeleted() {
	return recordsDeleted;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getRecordsInvalid() {
	return recordsInvalid;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getRecordsModified() {
	return recordsModified;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getRecordsScanned() {
	return recordsScanned;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.Integer
 */
public java.lang.Integer getSourceKey() {
	return sourceKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.lang.String
 */
public java.lang.String getStepInProgress() {
	return stepInProgress;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @return java.util.Date
 */
public java.util.Date getTriggerDate() {
	return triggerDate;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newDocDesc java.lang.String
 */
public void setDocDesc(java.lang.String newDocDesc) {
	docDesc = newDocDesc;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newExecutionDate java.util.Date
 */
public void setExecutionDate(java.util.Date newExecutionDate) {
	executionDate = newExecutionDate;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newFileName java.lang.String
 */
public void setFileName(java.lang.String newFileName) {
	fileName = newFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newGenerationNumber java.lang.Integer
 */
public void setGenerationNumber(java.lang.Integer newGenerationNumber) {
	generationNumber = newGenerationNumber;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newLastCommitRecord java.lang.Integer
 */
public void setLastCommitRecord(java.lang.Integer newLastCommitRecord) {
	lastCommitRecord = newLastCommitRecord;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newOperationPrm java.lang.String
 */
public void setOperationPrm(java.lang.String newOperationPrm) {
	operationPrm = newOperationPrm;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newProcessDocKey java.lang.Long
 */
public void setProcessDocKey(java.lang.Long newProcessDocKey) {
	processDocKey = newProcessDocKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newProcessKey java.lang.Integer
 */
public void setProcessKey(java.lang.Integer newProcessKey) {
	processKey = newProcessKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newProcessStatus java.lang.String
 */
public void setProcessStatus(java.lang.String newProcessStatus) {
	processStatus = newProcessStatus;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newRecordsAdded java.lang.Integer
 */
public void setRecordsAdded(java.lang.Integer newRecordsAdded) {
	recordsAdded = newRecordsAdded;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newRecordsDeleted java.lang.Integer
 */
public void setRecordsDeleted(java.lang.Integer newRecordsDeleted) {
	recordsDeleted = newRecordsDeleted;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newRecordsInvalid java.lang.Integer
 */
public void setRecordsInvalid(java.lang.Integer newRecordsInvalid) {
	recordsInvalid = newRecordsInvalid;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newRecordsModified java.lang.Integer
 */
public void setRecordsModified(java.lang.Integer newRecordsModified) {
	recordsModified = newRecordsModified;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newRecordsScanned java.lang.Integer
 */
public void setRecordsScanned(java.lang.Integer newRecordsScanned) {
	recordsScanned = newRecordsScanned;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newSourceKey java.lang.Integer
 */
public void setSourceKey(java.lang.Integer newSourceKey) {
	sourceKey = newSourceKey;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newStepInProgress java.lang.String
 */
public void setStepInProgress(java.lang.String newStepInProgress) {
	stepInProgress = newStepInProgress;
}
/**
 * Insert the method's description here.
 * Creation date: (11/05/2003 08:39:01)
 * @param newTriggerDate java.util.Date
 */
public void setTriggerDate(java.util.Date newTriggerDate) {
	triggerDate = newTriggerDate;
}
	/**
	 * @return
	 */
	public String getProcessDescription()
	{
		return processDescription;
	}

	/**
	 * @param string
	 */
	public void setProcessDescription(String string)
	{
		processDescription = string;
	}
	/**
	 * 
	 */
	public void getSourceNameParam() {
		// TODO Auto-generated method stub
		
	}

}
