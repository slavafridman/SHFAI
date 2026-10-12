package bzq.shf.model;

import java.sql.Timestamp;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Vector;

import javax.jms.JMSException;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.xml.bind.JAXBException;
import javax.xml.xpath.XPathExpressionException;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.w3c.dom.Document;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.OptShSpFlagBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.forms.EmployeeDataForm;
import bzq.shf.forms.OptShfSpForm;
import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TibcoQueueMessageSender;
import bzq.utils.AppResources;
import bzq.shfsp.request.SHFSPBreaks;

public class OptShfSpModel {
	
	private static Logger logger = Logger.getLogger(OptShfSpModel.class);
	private OptShfSpForm form;
	
	public OptShfSpModel() {
		super();
	}
	public OptShfSpModel(OptShfSpForm form) {
		this.form = form;
	}
	
	public Vector<String> getAllowedMokedOrSingle () throws ShfException {
		logger.debug("getAllowedMokedOrSingle()");
		
		UserProfile userProfile = form.getUserProfile();
		Vector<String> allowedUnits = userProfile.getAllowedUnits();	// get user allowed units
		Vector <OrgUnitTableForm> allUnits = AppResources.getInstance().getTablesContainer().getTable("unitCode");
		Vector <String> allowedMoked = new Vector<String>();

		if (userProfile != null) {
			if (userProfile.getAllowedAgaf() != null ) {
				EmployeeDataForm empForm = new EmployeeDataForm();
				empForm.setIdNumber(userProfile.getId());
				EmployeeDataModel empModel = new EmployeeDataModel(empForm);
				empModel.populateByEmpIdNum();
				allowedMoked.add(SHFTableUtils.getMokedCodeOf(empForm.getOrgUnitId()));

			} 
		}
		if (allowedMoked.size() == 0) {
			for (OrgUnitTableForm unit : allUnits) {
				if (unit.getType() != null && unit.getType().equals(SHFConstants.MOKED_UNIT)) {
					for (String allowedUnit : allowedUnits) {
						if (unit.getCode().equals(allowedUnit)) {
							allowedMoked.add(unit.getCode());
						}
					}
				}
			}
		}
		return allowedMoked;
	}
	
	public Vector<OptShSpFlagBean> populateByUnitCodeVec (Vector <String> mokedUnits) throws ShfException {
		logger.debug("populateByUnitCodeVec()");
		
		if (mokedUnits == null || mokedUnits.size() == 0) {
			logger.error("Parameter is null or empty");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		}
		Vector<OptShSpFlagBean> beanVec = null;
		
		StringBuffer sql = new StringBuffer();
		
		sql.append("SELECT t.* FROM shifter.shf_opt_shfsp_flag t ");
		sql.append("WHERE t.ORG_UNIT_CODE IN ( ");
			for (int i = 0; i < mokedUnits.size(); i++) {
				sql.append("'"+mokedUnits.get(i)+"'");
				if (i < mokedUnits.size()-1) {
					sql.append(", ");
				}
			}
		sql.append(") ");
		
		DBAccess dBAccess = null;
		try{
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.executeQuery();
			beanVec = new Vector<OptShSpFlagBean>();
			dBAccess.populate("bzq.shf.bean.OptShSpFlagBean", beanVec);
			
		} catch(DBQueryNoRowsException e) {
		
		} catch (DBException e) {
			logger.error("DB error in populateByUnitCodeVec() : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
			
		} finally {
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("Error in populateByUnitCodeVec() while db close: " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
		
		return beanVec;
		
	}
	
	public void updateOptSHFSPFlag (ServletContext servContext) throws ShfException {
		logger.debug("updateOptSHFSPFlag()");
		
		// get current data for my moked units
		Vector<String> myMokedUnits = getAllowedMokedOrSingle();
		Vector<OptShSpFlagBean> beanVec = populateByUnitCodeVec(myMokedUnits);
		
		// detect changes from user
		Vector<String> insertVec = new Vector<String>();
		Vector<String> updateTrueVec = new Vector<String>();
		Vector<String> updateFalseVec = new Vector<String>();
		
		if (form.getFlaggedUnits() != null && beanVec != null) {	// if user flagged any units and any of his allowed moked units exist in DB
			for (String flaggedUnit : form.getFlaggedUnits()) {
				
				boolean found = false;
				
				for (OptShSpFlagBean optShSpFlagBean : beanVec) {
					if (flaggedUnit.equals(optShSpFlagBean.getOrgUnitCode())) {
						found = true;
						if ( ! optShSpFlagBean.isFlagEnabled()) {	// if flagged in form and exist in DB with false status -> update to true
							updateTrueVec.add(optShSpFlagBean.getOrgUnitCode());
						}
						break;
					}
				}
				if ( ! found) {	// flagged in form, not exist in DB -> insert
					insertVec.add(flaggedUnit);
				}
			}
			
			for (OptShSpFlagBean optShSpFlagBean : beanVec) {	// Not flagged in form and exist in DB with status true -> update to false
				boolean found = false;
				for (String flaggedUnit : form.getFlaggedUnits()) {
					if (flaggedUnit.equals(optShSpFlagBean.getOrgUnitCode())) {
						found = true;
						break;
					}
				}
				if ( ! found && optShSpFlagBean.isFlagEnabled()) {
					updateFalseVec.add(optShSpFlagBean.getOrgUnitCode());
				}
			}
			
		} else if (form.getFlaggedUnits() == null && beanVec != null) {	// No flagged units but exist in dB, update to false
			
			for (OptShSpFlagBean optShSpFlagBean : beanVec) { 
				if(optShSpFlagBean.isFlagEnabled()) {
					updateFalseVec.add(optShSpFlagBean.getOrgUnitCode());
				}
			}
			
		} else if (beanVec == null && form.getFlaggedUnits() != null) {	// Not exist in DB, insert flagged units
			for (String flaggedUnit : form.getFlaggedUnits()) {
				insertVec.add(flaggedUnit);
			}
		}
		UserProfile userProfile = form.getUserProfile();
		
		// update changes - insert
		
		if (insertVec.size() > 0) {
			
			StringBuffer sql = new StringBuffer();
			
			sql.append("INSERT ALL ");
			Iterator<String> iter = insertVec.iterator();
			while ( iter.hasNext() ) {
				iter.next();
				sql.append("INTO SHIFTER.SHF_OPT_SHFSP_FLAG (ORG_UNIT_CODE, FLAG_ENABLED, UPDATE_TIME, UPDATE_USER_ID, UPDATE_USER, UPDATE_REASON) VALUES (?,?,?,?,?,?) ");
			}
			sql.append("SELECT * FROM DUAL");
			
			int index = 1;
			DBAccess dBAccess = null;
			try {
				dBAccess = new DBAccess();
				dBAccess.prepareStatement(sql.toString());
				for (int i=0; i<insertVec.size(); i++) {
					dBAccess.setString(index++, insertVec.get(i));
					dBAccess.setString(index++, "true");
					dBAccess.setTimestamp(index++, new Timestamp(System.currentTimeMillis()));
					dBAccess.setString(index++, userProfile.getId());
					dBAccess.setString(index++, userProfile.getFirstName() + " " + userProfile.getLastName());
					dBAccess.setString(index++, "reason");

				}

				int dbResult = dBAccess.executeUpdate();
			} catch (DBException e) {
				logger.error("DB error in updateOptSHFSPFlag()  " + e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			} finally{
				try {
					dBAccess.close();
				} catch (DBException e) {
					logger.error("Error in updateOptSHFSPFlag() while db close: " + e.getMessage());
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
					throw new ShfException(actionErrors);
				}
			}
		}
		
		// update changes - update
		if (updateFalseVec.size() > 0 || updateTrueVec.size() > 0) {
			updateByFalseTrueVec(updateFalseVec, updateTrueVec);
		}
		
		// transaction
		
		Vector<String> allUnits = new Vector<String>();
		if(updateTrueVec.size() > 0) {
			allUnits.addAll(updateTrueVec);
		}
		if (insertVec.size() > 0) {
			allUnits.addAll(insertVec);
		}
		if (updateFalseVec.size() > 0) {
			allUnits.addAll(updateFalseVec);
		}
		
		if (allUnits.size() == 0) {
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.info.NoChanges"));
			throw new ShfException(actionErrors);
		}
		
		Map<Long, String> transId = new HashMap<Long, String>();
		for (String unit : allUnits) {	// iterate and send FLAG ON/OFF message/s to SoftPhone
			
			bzq.shfsp.request.ObjectFactory of = new bzq.shfsp.request.ObjectFactory();
			bzq.shfsp.request.SHFSPBreaks breakObject = of.createSHFSPBreaks();
			SHFUtils.setSHFSPMessageDefaults(breakObject);
			breakObject.setUserId(userProfile.getId());
			breakObject.setOrgUnitId(unit);
			String actionid = null;
			if (updateTrueVec.contains(unit) || insertVec.contains(unit)) {
				actionid = SHFConstants.SHF_SP_ACTION_ID_FLAG_ON;
			} else if (updateFalseVec.contains(unit)) {
				actionid = SHFConstants.SHF_SP_ACTION_ID_FLAG_OFF;
			}
			breakObject.setActionId(actionid);
			
			String xmlStringMsg = null;
			try {
				xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
			} catch (JAXBException e) {
				logger.error("Error while creating XML string for sending message : " + e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
			
			TransactionBean transBean = new TransactionBean();
			transBean.setProcessId(SHFConstants.SHF_SP_PROCESS_ID_BREAK_UPDATE);
			transBean.setSource("SHF");
			transBean.setDestination("IVR");
			transBean.setEmployeeId(userProfile.getId());
			transBean.setXmlRequest(xmlStringMsg);
			
			BreakDataModel breakModel = new BreakDataModel();
			breakModel.createMessageTransaction(transBean);
			transId.put(transBean.getId(), unit);
			
			breakObject.setTransactionId(String.valueOf(transBean.getId()));
			
			try {
				xmlStringMsg = SHFUtils.objToXmlString(breakObject, SHFConstants.SHF_SP_JAXB_REQUEST_CONTEXT);
				logger.info("xmlString : "+xmlStringMsg);
			} catch (JAXBException e) {
				logger.error("Error while creating XML string for sending message : " + e.getMessage());
			}
			
			if (xmlStringMsg != null && transBean.getId() != 0) {
				
				Document addConfigDoc = (Document)servContext.getAttribute("addConfigDoc");
				String queueName = null;
				try {
					queueName = SHFUtils.retrieveAttributeValue(addConfigDoc, "/app-config/jms/shf-sp/request/tibco-info/@queueJndiName");
				} catch (XPathExpressionException e2) {
					// TODO Auto-generated catch block
					e2.printStackTrace();
				}
				
				TibcoQueueMessageSender tqms = null;
				if (queueName != null && queueName.length() > 0) {
					try {
						tqms = new TibcoQueueMessageSender(queueName);
					} catch (IllegalArgumentException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					} catch (NamingException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					} catch (JMSException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					}
					
					try {
						tqms.send(xmlStringMsg, true);	// send message
					} catch (IllegalArgumentException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					} catch (JMSException e1) {
						// TODO Auto-generated catch block
						e1.printStackTrace();
					}
				}
			}
		}
		
		// if message failed, rollback
		BreakDataModel breakModel = new BreakDataModel();
		Vector<TransactionBean> successRespTotal = new Vector<TransactionBean>();	// received replies - with success status
		int respTotal = 0;	// counter total received replies
		Vector<Long> tmpUnitVec = new Vector<Long>();
		Iterator<Long> itr = transId.keySet().iterator();
		
		while (itr.hasNext()) {
			tmpUnitVec.add(itr.next());
		}
		
		for (int i = 0; i < SHFConstants.SHF_SP_RESPONSE_CHECK_ATTEMPTS; i++) {
			
			try {
				logger.info("Sending thread to sleep for "+SHFConstants.SHF_SP_RESPONSE_CHECK_INTERVAL/1000+" sec, attempt no."+(i+1)+" ...");
				Thread.sleep(SHFConstants.SHF_SP_RESPONSE_CHECK_INTERVAL);
				logger.info("Thread woke up from sleep and running ...");
			} catch (InterruptedException e) {
				logger.error("Error while sending thread to sleep : " + e.getMessage());
			}
			
			Vector<TransactionBean> resp = breakModel.populateTransByIdVec(tmpUnitVec);
			if (resp != null) {
				for (TransactionBean respBean : resp) {
					boolean found = false;
					
					for (TransactionBean totalBean  : successRespTotal) {
						if (respBean.getId() == totalBean.getId()) {
							found = true;
						}
					}
					
					if ( ! found ) {
						respTotal++;
						if (SHFConstants.SHF_SP_RESPONSE_SUCCESS_CODE == respBean.getStatus() && respBean.getXmlResponse() != null) {
							successRespTotal.add(respBean);
						}
					}
				}
		
				if (respTotal == transId.size()) {
					break;
				}
			}
		}
		
		if (successRespTotal.size() == transId.size()) {
			logger.info("All changes completed successfully");
		} else {
			
			// remove successful response(s) and reverse relevant changes
			logger.info("Attempting to revert changes ... ");
			for (TransactionBean respBean : successRespTotal) {
				insertVec.remove((String)transId.get(respBean.getId()));
				updateTrueVec.remove((String)transId.get(respBean.getId()));
				updateFalseVec.remove((String)transId.get(respBean.getId()));
			}
			
			// undo update, reverse parameter order to undo original changes
			if (updateTrueVec.size() > 0 || updateFalseVec.size() > 0) {
				updateByFalseTrueVec(updateTrueVec, updateFalseVec);
			}
			
			// undo insert
			if (insertVec.size() > 0) {
				delByOrgUnitCodeVec(insertVec);
			}
			
			// notify user about partial success / or no success at all
			if (successRespTotal.size() > 0 ) {
				System.out.println("partial success, try again later");
				
				
			} else {
				System.out.println("Sync failed  :( ");
			}
		}
		
	}
	
	public void delByOrgUnitCodeVec (Vector<String> orgUnits) throws ShfException {
		logger.debug("Starting delByOrgUnitCodeVec()");

		StringBuffer sql = new StringBuffer();
		
		sql.append("DELETE FROM SHIFTER.SHF_OPT_SHFSP_FLAG ");
		sql.append("WHERE ORG_UNIT_CODE IN (  ");
			for (int i = 0; i < orgUnits.size(); i++) {
				sql.append("'"+orgUnits.get(i)+"'");
				if (1 < orgUnits.size()-1) {
					sql.append(",");
				}
			}
		sql.append(")");
		
		DBAccess db = null;					
		try {
			db = new DBAccess();
			db.prepareStatement(sql.toString());
			db.executeUpdate();

		}catch (DBUpdateNoRowsException e) {

		}catch (DBException e) {
			logger.error("DB error while deleting : " + e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}finally{
			try {
				db.close();
			} catch (DBException e) {
				logger.error("DB error while closing connection : " + e.getMessage());
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
		}	
	}
	
	public void updateByFalseTrueVec (Vector<String> updateFalseVec,  Vector<String> updateTrueVec) throws IllegalArgumentException, ShfException {
		logger.debug("Starting updateByFalseTrueVec()");
		
		if ((updateFalseVec == null && updateTrueVec == null) || (updateFalseVec.size() == 0 && updateTrueVec.size() == 0) ) {
			logger.error("Both parameters are null or size is zero");
			throw new IllegalArgumentException();
		}
		
		Vector<String> allUnitsForUpdate = new Vector<String>();
		if (updateFalseVec != null && updateFalseVec.size() > 0) {
			allUnitsForUpdate.addAll(updateFalseVec);
		}
		if (updateTrueVec != null && updateTrueVec.size() > 0) {
			allUnitsForUpdate.addAll(updateTrueVec);
		}
		
		StringBuffer sql = new StringBuffer();
		sql.append("UPDATE SHIFTER.SHF_OPT_SHFSP_FLAG f ");
		sql.append("SET f.FLAG_ENABLED = CASE ");
			if (updateFalseVec.size() > 0) {
				sql.append("WHEN f.ORG_UNIT_CODE IN ( ");
				for (int i = 0; i < updateFalseVec.size(); i++) {
					sql.append("'"+updateFalseVec.get(i)+"'");
					if ( i < updateFalseVec.size()-1) {
						sql.append(",");
					}
				}
				sql.append(") THEN 'false' ");
			}
			if (updateTrueVec.size() > 0) {
				sql.append("WHEN f.ORG_UNIT_CODE IN ( ");
				for (int i = 0; i < updateTrueVec.size(); i++) {
					sql.append("'"+updateTrueVec.get(i)+"'");
					if ( i < updateTrueVec.size()-1) {
						sql.append(",");
					}
				}
				sql.append(") THEN 'true' ");
			}
		sql.append("END, ");
		
		sql.append("f.UPDATE_TIME = ?, ");	// 1
		sql.append("f.UPDATE_USER_ID = ?, ");	// 2
		sql.append("f.UPDATE_USER = ?, ");	// 3
		sql.append("f.UPDATE_REASON = CASE ");
			for (String unitForUpdate : allUnitsForUpdate) {
				sql.append("WHEN f.ORG_UNIT_CODE = '" + unitForUpdate + "' THEN 'reason' ");
			}
		sql.append("END ");
		
		sql.append("WHERE f.ORG_UNIT_CODE IN ( ") ;
			for (int i = 0; i < allUnitsForUpdate.size(); i++) {
				sql.append("'"+allUnitsForUpdate.get(i)+"'");
				if ( i < allUnitsForUpdate.size()-1) {
					sql.append(",");
				}
				
			}
		sql.append(" ) ");
		
		DBAccess dBAccess = null;
		try {
			dBAccess = new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setTimestamp(1, new Date());	// 1
			dBAccess.setString(2, form.getUserProfile().getId());	// 2
			dBAccess.setString(3, form.getUserProfile().getFirstName() + " " + form.getUserProfile().getLastName());	// 3
			int dbResult = dBAccess.executeUpdate();
		} catch (DBException e) {
			logger.error("DB error while updating : " + e.getMessage());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
			throw new ShfException(actionErrors);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				logger.error("Error while db close: " + e.getMessage());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general"));
				throw new ShfException(actionErrors);
			}
		}
	}
	
	public OptShfSpForm getForm() {
		return form;
	}

	public void setForm(OptShfSpForm form) {
		this.form = form;
	}
	

	
}
