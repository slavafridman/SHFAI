package bzq.shf.batch.beans;

/**
 * Insert the type's description here.
 * Creation date: (05/11/2002 15:50:47)
 * @author: Natana Cohen
 */
public interface BatchDocInfo
{

	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.String
	 */
	public java.lang.String getDocDesc();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.util.Date
	 */
	public java.util.Date getExecutionDate();
	public java.util.HashMap getFieldsMapping();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.String
	 */
	public java.lang.String getFileName();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getGenerationNumber();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getLastCommitRecord();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.String
	 */
	public java.lang.String getOperationPrm();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Long
	 */
	public java.lang.Long getProcessDocKey();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getProcessKey();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.String
	 */
	public java.lang.String getProcessStatus();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getRecordsAdded();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getRecordsDeleted();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getRecordsInvalid();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getRecordsModified();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getRecordsScanned();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.Integer
	 */
	public java.lang.Integer getSourceKey();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.lang.String
	 */
	public java.lang.String getStepInProgress();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @return java.util.Date
	 */
	public java.util.Date getTriggerDate();
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newDocDesc java.lang.String
	 */
	public void setDocDesc(java.lang.String newDocDesc);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newExecutionDate java.util.Date
	 */
	public void setExecutionDate(java.util.Date newExecutionDate);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newFileName java.lang.String
	 */
	public void setFileName(java.lang.String newFileName);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newGenerationNumber java.lang.Integer
	 */
	public void setGenerationNumber(java.lang.Integer newGenerationNumber);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newLastCommitRecord java.lang.Integer
	 */
	public void setLastCommitRecord(java.lang.Integer newLastCommitRecord);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newOperationPrm java.lang.String
	 */
	public void setOperationPrm(java.lang.String newOperationPrm);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newProcessDocKey java.lang.Long
	 */
	public void setProcessDocKey(java.lang.Long newProcessDocKey);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newProcessKey java.lang.Integer
	 */
	public void setProcessKey(java.lang.Integer newProcessKey);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newProcessStatus java.lang.String
	 */
	public void setProcessStatus(java.lang.String newProcessStatus);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newRecordsAdded java.lang.Integer
	 */
	public void setRecordsAdded(java.lang.Integer newRecordsAdded);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newRecordsDeleted java.lang.Integer
	 */
	public void setRecordsDeleted(java.lang.Integer newRecordsDeleted);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newRecordsInvalid java.lang.Integer
	 */
	public void setRecordsInvalid(java.lang.Integer newRecordsInvalid);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newRecordsModified java.lang.Integer
	 */
	public void setRecordsModified(java.lang.Integer newRecordsModified);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newRecordsScanned java.lang.Integer
	 */
	public void setRecordsScanned(java.lang.Integer newRecordsScanned);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newSourceKey java.lang.Integer
	 */
	public void setSourceKey(java.lang.Integer newSourceKey);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newStepInProgress java.lang.String
	 */
	public void setStepInProgress(java.lang.String newStepInProgress);
	/**
	 * Insert the method's description here.
	 * Creation date: (11/05/2003 08:39:01)
	 * @param newTriggerDate java.util.Date
	 */
	public void setTriggerDate(java.util.Date newTriggerDate);
}