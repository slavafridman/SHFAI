package bzq.shf.batch.beans;

/**
 * Insert the type's description here.
 * Creation date: (05/12/2002 17:58:40)
 * @author: Natana Cohen
 */
public class ProcessBean {
	private String fileStack = null;
	private String inputFileName = null; 
	private String inputFileDir = null;
	private String outputFileName = null;
	private String outputFileDir = null;
	private String logFileName = null;
	private String errorFileName = null;
	private String logFileDir = null;
	private String errorFileDir = null;
	private String processKey = null;
	private String logSeverityShf = null;	
	private String logSeverityShfBatch = null;	
	private String logSeverityBzq = null;			
	private String validatorForm = null;
	private java.lang.String controlFileName=null;
	private java.lang.String backupFileDir=null;
	private String attach=null;
	private String mailSubject=null;
	private String toAddress=null;
	private String fromAddress=null;
	private String mailBody=null;
	private String smtpServer=null;
	private String mailProtocol=null;
	private String serverCharset=null;
	private String clientCharset=null;
	
	
/**
 * ProcessBean constructor comment.
 */
public ProcessBean() {
	super();
}
/**
 * Insert the method's description here.
 * Creation date: (04/07/2004 09:25:41)
 * @return java.lang.String
 */
public java.lang.String getControlFileName() {
	return controlFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 13:42:04)
 * @return java.lang.String
 */
public java.lang.String getErrorFileDir() {
	return errorFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:37:29)
 * @return java.lang.String
 */
public java.lang.String getErrorFileName() {
	return errorFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (17/12/2003 14:00:59)
 * @return java.lang.String
 */
public java.lang.String getFileStack() {
	return fileStack;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:15)
 * @return java.lang.String
 */
public java.lang.String getInputFileDir() {
	return inputFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (05/12/2002 18:18:22)
 * @return java.lang.String
 */
public java.lang.String getInputFileName() {
	return inputFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 13:41:34)
 * @return java.lang.String
 */
public java.lang.String getLogFileDir() {
	return logFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:37:14)
 * @return java.lang.String
 */
public java.lang.String getLogFileName() {
	return logFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (10/11/2003 10:45:32)
 * @return java.lang.String
 */
public java.lang.String getLogSeverityBzq() {
	return logSeverityBzq;
}

/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:51)
 * @return java.lang.String
 */
public java.lang.String getOutputFileDir() {
	return outputFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:32)
 * @return java.lang.String
 */
public java.lang.String getOutputFileName() {
	return outputFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 14:38:10)
 * @return java.lang.String
 */
public java.lang.String getProcessKey() {
	return processKey;
}
/**
 * Insert the method's description here.
 * Creation date: (14/09/2003 15:25:51)
 * @return java.lang.String
 */
public java.lang.String getValidatorForm() {
	return validatorForm;
}
/**
 * Insert the method's description here.
 * Creation date: (04/07/2004 09:25:41)
 * @param newControlFileName java.lang.String
 */
public void setControlFileName(java.lang.String newControlFileName) {
	controlFileName = newControlFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 13:42:04)
 * @param newErrorFileDir java.lang.String
 */
public void setErrorFileDir(java.lang.String newErrorFileDir) {
	errorFileDir = newErrorFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:37:29)
 * @param newErrorFileName java.lang.String
 */
public void setErrorFileName(java.lang.String newErrorFileName) {
	errorFileName = newErrorFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (17/12/2003 14:00:59)
 * @param newFileStack java.lang.String
 */
public void setFileStack(java.lang.String newFileStack) {
	fileStack = newFileStack;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:15)
 * @param newInputFileDir java.lang.String
 */
public void setInputFileDir(java.lang.String newInputFileDir) {
	inputFileDir = newInputFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (05/12/2002 18:18:22)
 * @param newInputFileName java.lang.String
 */
public void setInputFileName(java.lang.String newInputFileName) {
	inputFileName = newInputFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 13:41:34)
 * @param newLogFileDir java.lang.String
 */
public void setLogFileDir(java.lang.String newLogFileDir) {
	logFileDir = newLogFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:37:14)
 * @param newLogFileName java.lang.String
 */
public void setLogFileName(java.lang.String newLogFileName) {
	logFileName = newLogFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (10/11/2003 10:45:32)
 * @param newLogSeverityBzq java.lang.String
 */
public void setLogSeverityBzq(java.lang.String newLogSeverityBzq) {
	logSeverityBzq = newLogSeverityBzq;
}

/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:51)
 * @param newOutputFileDir java.lang.String
 */
public void setOutputFileDir(java.lang.String newOutputFileDir) {
	outputFileDir = newOutputFileDir;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 12:36:32)
 * @param newOutputFileName java.lang.String
 */
public void setOutputFileName(java.lang.String newOutputFileName) {
	outputFileName = newOutputFileName;
}
/**
 * Insert the method's description here.
 * Creation date: (12/05/2003 14:38:10)
 * @param newProcessKey java.lang.String
 */
public void setProcessKey(java.lang.String newProcessKey) {
	processKey = newProcessKey;
}
/**
 * Insert the method's description here.
 * Creation date: (14/09/2003 15:25:51)
 * @param newValidatorForm java.lang.String
 */
public void setValidatorForm(java.lang.String newValidatorForm) {
	validatorForm = newValidatorForm;
}
	/**
	 * @return
	 */
	public java.lang.String getBackupFileDir()
	{
		return backupFileDir;
	}

	/**
	 * @param string
	 */
	public void setBackupFileDir(java.lang.String string)
	{
		backupFileDir = string;
	}
	
	
	/**
		 * @param string
		 */
	public void setAttach(String str){this.attach=str;}
	
	/**
		 * @return
		 */
	public String getAttach(){return attach;}
	
	/**
		 * @param string
		 */
	public void setMailSubject(String str){this.mailSubject=str;}
	
	/**
		 * @return
		 */
	public String getMailSubject(){return mailSubject;}
	
	/**
		 * @param string
		 */
	public void setToAddress(String str){this.toAddress=str;}
	
	/**
		 * @return
		 */
	public String getToAddress(){return toAddress;}
	
	/**
		 * @param string
		 */
	public void setFromAddress(String str){this.fromAddress=str;}
	
	/**
		 * @return
		 */
	public String getFromAddress(){return fromAddress;}
	
	/**
		 * @param string
		 */
	public void setMailBody(String str){this.mailBody=str;}
	
	/**
		 * @return
		 */
	public String getMailBody(){return mailBody;}
		
	/**
		 * @param string
		 */
	public void setSmtpServer(String str){this.smtpServer=str;}
	
	/**
		 * @return
		 */
	public String getSmtpServer(){return smtpServer;}
		
	/**
		 * @param string
		 */
	public void setMailProtocol(String str){this.mailProtocol=str;}
	
	/**
		 * @return
		 */
	public String getMailProtocol(){return mailProtocol;}
	
	/**
		 * @param string
		 */
	public void setServerCharset(String str){this.serverCharset=str;}
	
	/**
		 * @return
		 */
	public String getServerCharset(){return serverCharset;}
	
	/**
		 * @param string
		 */
	public void setClientCharset(String str){this.clientCharset=str;}
	
	/**
		 * @return
		 */
	public String getClientCharset(){return clientCharset;}
	
	/**
	 * @return
	 */
	public String getLogSeverityShf() {
		return logSeverityShf;
	}

	/**
	 * @return
	 */
	public String getLogSeverityShfBatch() {
		return logSeverityShfBatch;
	}

	/**
	 * @param string
	 */
	public void setLogSeverityShf(String string) {
		logSeverityShf = string;
	}

	/**
	 * @param string
	 */
	public void setLogSeverityShfBatch(String string) {
		logSeverityShfBatch = string;
	}

}
