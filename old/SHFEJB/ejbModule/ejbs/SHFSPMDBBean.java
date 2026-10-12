// @annotations-disabled tagSet="websphere" tagSet="ejb"
/* Created on 17/07/2016
 *
 * 
 */
package ejbs;

import java.io.StringReader;
import java.util.Date;
import java.util.Enumeration;

import javax.ejb.MessageDrivenContext;
import javax.jms.JMSException;
import javax.jms.TextMessage;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.db.DBUpdateNoRowsException;
import bzq.db.DSConnection;
import bzq.db.DBServicesFactory;
import bzq.shfsp.response.SHFSPBreaksResponse;

import org.apache.log4j.Appender;
import org.apache.log4j.ConsoleAppender;
import org.apache.log4j.DailyRollingFileAppender;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.log4j.NDC;
import org.apache.log4j.PatternLayout;
import org.apache.log4j.WriterAppender;



/**
 * Bean implementation class for Message-Driven Bean: SHFSPMDB
 *
 * @ejb.bean
 *	name="SHFSPMDB"
 *	transaction-type="Container"
 *  destination-type="javax.jms.Queue"
 *  
 *  @author 31180049
 */
public class SHFSPMDBBean implements javax.ejb.MessageDrivenBean, javax.jms.MessageListener {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Logger logger = Logger.getLogger(SHFSPMDBBean.class);
	
	private MessageDrivenContext myMessageDrivenCtx;
	/**
	 * getMessageDrivenContext
	 */
	public MessageDrivenContext getMessageDrivenContext() {
		return myMessageDrivenCtx;
	}
	/**
	 * setMessageDrivenContext
	 */
	public void setMessageDrivenContext(MessageDrivenContext ctx) {
		myMessageDrivenCtx = ctx;
	}
	/**
	 * ejbCreate
	 */
	public void ejbCreate() {
		System.out.println("Starting ejbCreate() ...");
		
		// init LOGGER
		PatternLayout layout = new PatternLayout("%d{dd-MM-yyyy HH:mm:ss.SSS} [%x] %-5p %-20.20C{1} - %m\r\n");
		WriterAppender appender = null;
		
		// init DB 
		DSConnection dsConnection = new DSConnection();
		dsConnection.setFactory("com.ibm.ejs.ns.jndi.CNInitialContextFactory");
		dsConnection.setIsDefaultDb("true");
		dsConnection.setProviderUrl("iiop://localhost:900");
		
		//----------------
		String configEnv = System.getProperty("BZQ_CONFIG_ENV");
		
		if (configEnv == null) {
			System.out.println("The environment property was not found, aborting MDB ...");
			return;
		}
		System.out.println("Detected env : " + configEnv);
		
		if ("local-dvlp".equals(configEnv)) {
			
			appender = new ConsoleAppender(layout);
			
			dsConnection.setDataSourceName("jdbc/shfdvlp");
			dsConnection.setName("shfdvlp");

		} else if ("server-dvlp".equals(configEnv)) {
			
			try {
				appender = new DailyRollingFileAppender(layout, "/logs/shf/dvlp/shfListener.log", "'-'yyyy-MM-dd'.log'");
			} catch (Exception e) {
				e.printStackTrace();
			}
			
			dsConnection.setDataSourceName("jdbc/shfxadvlp");
			dsConnection.setName("shfdvlp");

		} else if ("server-test".equals(configEnv)) {
			
			try {
				appender = new DailyRollingFileAppender(layout, "/logs/shf/test/shfListener.log", "'-'yyyy-MM-dd'.log'");
			} catch (Exception e) {
				e.printStackTrace();
			}
			
			dsConnection.setDataSourceName("jdbc/shfxatest");
			dsConnection.setName("shftest");

		} else if ("server-prod".equals(configEnv)) {
			
			try {
				appender = new DailyRollingFileAppender(layout, "/logs/shf/prod/shfListener.log", "'-'yyyy-MM-dd'.log'");
			} catch (Exception e) {
				e.printStackTrace();
			}
			
			dsConnection.setDataSourceName("jdbc/shfxaprod");
			dsConnection.setName("shfprod");

		} else {
			System.out.println("The environment property specified was not recognized, aborting MDB ...");
			return;
		}
		
		org.apache.log4j.Logger rootLogger = Logger.getRootLogger();
		Enumeration<WriterAppender> appenders = rootLogger.getAllAppenders();
		if ( ! appenders.hasMoreElements()) {
		    System.out.println("LOG4J config is missing, adding ...");
			Logger.getRootLogger().addAppender(appender);
			Logger.getRootLogger().setLevel(Level.INFO);
		} else {
		    System.out.println("appender found " + ((Appender) appenders.nextElement()).getName());
		}
		
//	    NDC.push("teeessingg44");
//	    NDC.pop();
//	    NDC.remove();

		DBServicesFactory.addDbServices(dsConnection);
		
	}
	/**
	 * ejbRemove
	 */
	public void ejbRemove() {
		
		logger.info("Start ejbRemove() ...");
	}
	
	/**
	 * onMessage
	 */
	public void onMessage(javax.jms.Message inMessage) {
	    TextMessage msg = null;

	    try {
	        if (inMessage instanceof TextMessage) {
	            msg = (TextMessage) inMessage;
	            logger.info("Listener: Message received: " +  msg.getText());
	            SHFSPBreaksResponse xmlRespObj = null;
	            try {
	            	xmlRespObj = (SHFSPBreaksResponse)xmlStringToObj(msg.getText(), new SHFSPBreaksResponse());
				} catch (JAXBException e) {
					logger.error("Error while creating object from response XML string : "+e.getMessage());
				}
				StringBuffer sql = new StringBuffer();
				
				sql.append("UPDATE shifter.shf_transactions t ");
				sql.append("SET t.UPDATE_DATE = ?, t.XML_RESPONSE = ?, t.STATUS = ? ");	// 1, 2, 3,
				
				if (xmlRespObj.getStatusDesc().length() > 0) {
					sql.append(" ,t.STATUS_DESCRIPTION = ? ");	// 4
				}
				sql.append("WHERE t.ID = ? ");	// 5
				
				DBAccess db = null;
				int param = 1;
				
				try {
					db = new DBAccess();
					db.prepareStatement(sql.toString());
					
					db.setTimestamp(param++, new Date());	// 1
					db.setString(param++, msg.getText());	// 2
					db.setInt(param++, Integer.parseInt(xmlRespObj.getStatusCode()));	// 3
					if (xmlRespObj.getStatusDesc().length() > 0) {
						db.setString(param++, xmlRespObj.getStatusDesc());	// 4
					}
					db.setLong(param++, Long.valueOf(xmlRespObj.getTransactionId()));	//5

					db.executeUpdate();
					logger.info("Listener : record updated successfully !");
				} catch(DBUpdateNoRowsException e){
					e.printStackTrace();
					logger.error("Unexpected empty resultSet while update", e);
				} catch (DBException e) {
					e.printStackTrace();
					logger.error("DB error while update : ", e);
				} catch (Throwable e) {
					e.printStackTrace();
					logger.error("Error while update : ", e);
				} finally{
					try {
						db.close();
					} catch (DBException e) {
						logger.error("Error while closing connection : ", e);
					}
				}
	            
	        } else {
	            logger.error("Message of wrong type: " + inMessage.getClass().getName());
	        }
	    } catch (JMSException e) {
	        logger.error("Error in onMessage() : " + e.getMessage());
	    } catch (Throwable te) {
	        logger.error("Error in onMessage() : " + te.getMessage());
	    }
	}
	
	public Object xmlStringToObj (String xmlString, Object obj) throws JAXBException {
		
		JAXBContext jaxbContext = JAXBContext.newInstance(obj.getClass());
		Unmarshaller unMarshaller = jaxbContext.createUnmarshaller();
		StringReader reader = new StringReader(xmlString);
		
		return unMarshaller.unmarshal(reader);
		
	}

}