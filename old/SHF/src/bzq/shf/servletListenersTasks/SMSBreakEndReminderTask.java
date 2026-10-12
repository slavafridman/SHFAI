package bzq.shf.servletListenersTasks;

import java.util.Calendar;
import java.util.Date;
import java.util.Vector;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.shf.bean.BreakSMSBean;
import bzq.shf.bean.TransactionBean;
import bzq.shf.model.BreakDataModel;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFSmsSender;
import bzq.shf.utils.SHFUtils;

public class SMSBreakEndReminderTask implements Runnable {
	private static Logger logger = Logger.getLogger(SMSBreakEndReminderTask.class);
	private ServletContext servCtx = null;
	
	private Vector<Integer> checkHours = new Vector<Integer>();
	private int lastCheckedHour = -1;
	

	public void run() {
		
		// must have try and catch first thing, else, if fail, the whole chain of execution might stop (executors might stop on first exception / error)
		try {
			logger.debug("Starting scheduled task via ScheduledExecutorService");
			
			// Pulse check
			if (checkHours.size() == 0) {
				checkHours.add(7); checkHours.add(15); checkHours.add(23);
			}
			
			int currHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
			
			if(checkHours.contains(currHour) && lastCheckedHour != currHour ) {
				logger.info("Pulse check for SMS BREAK REMINDER task");
				lastCheckedHour = currHour;
			}
			// Pulse check END
			
			// 1st get breaks that END in next X minutes
			int min = 5;	// next 5 minutes
			
			StringBuffer sqlInsert = new StringBuffer();
			sqlInsert.append("SELECT * FROM SHIFTER.SHF_BREAK_SMS S ");
			sqlInsert.append("WHERE S.BREAK_END BETWEEN SYSDATE AND SYSDATE + "+min+"/1440 ");
			sqlInsert.append("AND S.SMS_SENT_DATE IS NULL ");
			
			DBAccess db = new DBAccess();
			Vector<BreakSMSBean> smsBeanVec = null;
			try {
				db.prepareStatement(sqlInsert.toString());
				
				db.executeQuery();
				
				smsBeanVec = new Vector<BreakSMSBean>();
				db.populate("bzq.shf.bean.BreakSMSBean", smsBeanVec);
				
			} catch(DBQueryNoRowsException e){
				// nothing to do
			} catch (DBException e) {
				logger.error("DB error while populating : " +e.getMessage(), e);
			} finally {
				try {
					db.close();
				} catch (DBException e) {
					logger.error("Error while closing connection : " +e.getMessage(), e);
				}
			}

			if (smsBeanVec != null && smsBeanVec.size() > 0) {
				
				// 2nd insert to transaction table
				SHFSmsSender smsSender = new SHFSmsSender(null, null, getServCtx());
				Vector<String> vecTo = new Vector<String>();
				for (BreakSMSBean breakSMSBean : smsBeanVec) {
					vecTo.add(breakSMSBean.getAgentCelNum());
				}
				String xmlMsg = SHFUtils.convertDocToXMLString(smsSender.createSMSXMLDoc(vecTo, SHFConstants.BREAK_SMS_MSG));
				BreakDataModel breakModel = new BreakDataModel();
				TransactionBean transBean = breakModel.getTransBeanBase(SHFConstants.BREAK_SMS_PROCESS_ID_SMS, SHFConstants.BREAK_SMS_SOURCE, SHFConstants.BREAK_SMS_DESTINATION, SHFConstants.BREAK_SMS_USERID, xmlMsg);
				breakModel.createMessageTransaction(transBean);
				 
				// 3rd send SMS
				smsSender.setVecTo(vecTo);
				smsSender.setMessage(SHFConstants.BREAK_SMS_MSG);
				boolean sentOK = true;
				try {
					logger.info("Sending SMS for Transaction id : "+transBean.getId());
					smsSender.sendSHFSmsQueueMessage();
				} catch (Exception e) {
					sentOK = false;
				}
				 
				 // 4th update sent date
				if (sentOK) {
					
					int param = 1;
					StringBuffer sqlUpdate = new StringBuffer();
					sqlUpdate.append("UPDATE SHIFTER.SHF_BREAK_SMS S ");
					sqlUpdate.append("SET S.SMS_SENT_DATE = ? ");	// 1
					sqlUpdate.append("WHERE S.SMS_ID IN ( ");
					
					for (int i = 0; i < smsBeanVec.size(); i++) {
						sqlUpdate.append("?");
						if (i < smsBeanVec.size() - 1) {
							sqlUpdate.append(",");
						}
					}
					sqlUpdate.append(") ");
					
					db = new DBAccess();
					
					try {
						db.prepareStatement(sqlUpdate.toString());
						
						db.setTimestamp(param++, new Date());	// 1
						for (BreakSMSBean breakSMSBean : smsBeanVec) {
							db.setLong(param++, breakSMSBean.getSmsId());
						}
						
						db.executeUpdate();
						
					} catch(DBUpdateNoRowsException e) {
						 logger.error("Error while updating, unexpected NoRowsException for TRANSACTION_ID = "+transBean.getId()+" : " + e.getMessage());
					} catch (DBException e) {
						logger.error("DB error while update : " + e.getMessage(), e);
					} finally {
						try {
							db.close();
						} catch (DBException e) {
							logger.error("Error while closing DB connection : " + e.getMessage(), e);
						}
					}
				}
			}
			
		} catch (Throwable  t) {	// "Throwable" since we must catch errors also
			try {
				logger.error("Error while performing task "+this.getClass().getName()+" : " + t.getMessage(), t);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	} // END METHOD

	public ServletContext getServCtx() {
		return servCtx;
	}

	public void setServCtx(ServletContext servCtx) {
		this.servCtx = servCtx;
	}

}	// END CLASS
