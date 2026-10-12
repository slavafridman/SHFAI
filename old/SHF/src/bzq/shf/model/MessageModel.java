/*
 * Created on 09/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.model;

import java.util.Iterator;
import java.util.Vector;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;

import bzq.db.DBAccess;
import bzq.db.DBException;
import bzq.db.DBQueryNoRowsException;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.dao.FactoryDao;
import bzq.shf.dao.SimpleFactoryDao;
import bzq.shf.profile.UserProfile;
import bzq.shf.transfer.OfferReplaceByCritrion;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.transfer.ReplaceCandidates;
import bzq.shf.utils.AgentNotExistException;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class MessageModel {
	private static Logger logger = Logger.getLogger(MessageModel.class);
	
	private ServletContext sCtx;

	public Vector getAllMessage(String empid)	{
		logger.debug("Starting getAllMessage()");
				
		FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE);
		Vector<ReplaceMassage> messages = null;
		Vector<Integer> msgs4read = null;
		try {
			messages = factoryDao.select(empid);	// get messages to display for agent
			
			if ( messages != null && messages.size() > 0 ) {	// mark them as read
				msgs4read = new Vector<Integer>();
				for (ReplaceMassage msg : messages) {
					msgs4read.add(msg.getId());
				}
				factoryDao.updateToRead(msgs4read, empid);
			}
			
		} catch (ShfException e) {
			e.printStackTrace();
		}	
		return messages;
	}
	
	public String getEmpId(String userId) throws ShfException	{
		logger.debug("MessageModel: getEmpId");
		String empId = null;
		
		StringBuffer sql=new StringBuffer();
		sql.append("SELECT EMPLOYEE_ID FROM SHIFTER.SHF_EMPLOYEES e WHERE substr(e.emp_id_number,1,8)=? ");
		
		DBAccess dBAccess=null;
		try {
			dBAccess=new DBAccess();
			dBAccess.prepareStatement(sql.toString());
			dBAccess.setString(1,userId.substring(0,8));
			dBAccess.executeQuery();
			if(dBAccess.next()){
				empId = dBAccess.getString(1);
			}			
		}  catch(DBQueryNoRowsException e){
			throw new AgentNotExistException("");
		} catch (DBException e) {
			throw new ShfException("error on MessageModel select from employees ", e);
		} finally{
			try {
				dBAccess.close();
			} catch (DBException e) {
				throw new ShfException("db.close()", e);
			}
		}
		return empId;
	}

	/**
	 * Function to update message status to deleted
	 * @param msgs4del Vector of message IDs
	 * @throws ShfException
	 */
	public void updateMessagesToDeleted(Vector<ReplaceMassage> msgs4del) throws ShfException{
		logger.debug("MessageModel: updateMessagesToDeleted()");
		FactoryDao factoryDao = FactoryDao.getDaoFactory(FactoryDao.REPLACE_MASSAGE);
		Vector <String> idsToUpdate = new Vector<String>();
		Vector <String> idsToReject = new Vector<String>();
		
		for (ReplaceMassage message : msgs4del) {
			idsToUpdate.add(String.valueOf(message.getId()));// prepare for update to delete
			if ( message.getMsgType() != null && message.getMsgType().equals(FactoryDao.MSG_TYPE_OFFER_REPLACE) ) {	// prepare for sending rejection to offers
				idsToReject.add(String.valueOf(message.getOfferShiftId()));
			}
		}
		
		try{
			// 1st try to update
			factoryDao.updateToDel(idsToUpdate);
			
			// 2nd reject offers
			if (idsToReject.size() > 0) {
				SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
				Vector<OfferReplaceByCritrion> offersVec = null;
				Vector<OfferReplaceByCritrion> offersToReject = null;
				
				// populate offers to me in order to send reject messages
				offersVec = simpleFactoryDao.populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId(idsToReject);	// get from repository all shifts that has offers to me in the current delete request
				if (offersVec != null && offersVec.size() > 0) {
					offersToReject = new Vector<OfferReplaceByCritrion>();
					
					// filter those who need reject message (ie if offerer switched with other or removed himself from repository no need for message)
					if (offersVec != null && offersVec.size() > 0) {
						ReplaceModel replaceModel = new ReplaceModel();
						
						for (OfferReplaceByCritrion offerReplaceByCritrion: offersVec) {
							
							for (ReplaceMassage message : msgs4del) {
								
								if ( offerReplaceByCritrion.getShiftId().equals(String.valueOf(message.getOfferShiftId())) ) {
									
									if ( (offerReplaceByCritrion.getEmployeeId() != null && offerReplaceByCritrion.getEmployeeId().equals(String.valueOf(message.getOfferEmployeeId()))	)// if offerer did not switch
										&& ( offerReplaceByCritrion.getOfferEmployeeId() != null && offerReplaceByCritrion.getOfferEmployeeId().equals(String.valueOf(message.getEmpId())) )	// and still offers to me
										&& (  offerReplaceByCritrion.getStartTime() != null && offerReplaceByCritrion.getStartTime().equals(message.getOfferShiftStart()) )	// and same start / end times
										&& (  offerReplaceByCritrion.getEndTime() != null && offerReplaceByCritrion.getEndTime().equals(message.getOfferShiftEnd()) )
									) {
										offersToReject.add(offerReplaceByCritrion);
									}
								}
							}
						}
						
						// finally reject their offers
						if ( offersToReject.size() > 0 ) {
							for ( OfferReplaceByCritrion offer4reject : offersToReject ) {
								OfferReplaceByCritrion offer = new OfferReplaceByCritrion();
								
								offer.setShiftId(offer4reject.getOffer());
								offer.setStartTime(offer4reject.getOfferStartTime());
								offer.setEndTime(offer4reject.getOfferEndTime());
								offer.setEmployeeId(offer4reject.getOfferEmployeeId());
								offer.setFullname(offer4reject.getOfferFullName());
								
								offer.setOffer(offer4reject.getShiftId());
								offer.setOfferStartTime(offer4reject.getStartTime());
								offer.setOfferEndTime(offer4reject.getEndTime());
								offer.setOfferFullName(offer4reject.getFullname());
								offer.setOfferEmployeeId(offer4reject.getEmployeeId());
								
								replaceModel.rejectReplaceOffer(offer, "");
								
							}
						}
					}
				}
			}
			
		}catch(Exception e){
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.updateFailed",null));
			throw new ShfException(actionErrors);
		}
		
		
	}
	
	/**
	 *  Function to switch between two shifts
	 * @param replaceMessage
	 * @throws ShfException
	 */
	public void acceptOffer(ReplaceMassage replaceMessage, HttpServletRequest request) throws ShfException {
		logger.debug("MessageModel: acceptOffer()");
		if (replaceMessage == null || replaceMessage.getShiftId() == 0 || replaceMessage.getOfferShiftId() == 0) {
			logger.error("error in acceptOffer(), replaceMessage or replaceMessage.getShiftId() or replaceMessage.getOfferShiftId() is null");
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
		// 1st need to check if offer is still relevant (i.e. offerer already switched with someone else)
		AgentDayBean myShift = null;
		AgentDayBean offerShift = null;
		try {
			myShift = ShiftDataModel.populateShift(replaceMessage.getShiftId());
			offerShift = ShiftDataModel.populateShift(replaceMessage.getOfferShiftId());
		} catch (ShfException e) {
			logger.error("error in acceptOffer(), while populating shifts for check: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
		if ( ! isOfferRelevant(replaceMessage, myShift, offerShift) ) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchOfferIrrelevant", null));
				request.setAttribute("messageAcceptOffer", "false");
				throw new ShfException(actionErrors);
		}

		// 2nd offer is valid, temporary insert to repository and then attempt to switch shifts
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		
		// insert into repository (if not already exist there, i.e. accept offer if both agents in repository)
		ReplaceModel replaceModel = new ReplaceModel();
		if ( ! replaceModel.isExistInRepository(String.valueOf(replaceMessage.getShiftId())) ) {
			Vector<String>	offer = new Vector<String>();
			offer.add(String.valueOf( replaceMessage.getOfferShiftId()));
			try {
				simpleFactoryDao.insertShiftToReplace(String.valueOf(replaceMessage.getShiftId()), null, SimpleFactoryDao.OPEN_REPLACE_STATUS,"");
			} catch (Exception e) {
				logger.error("error in acceptOffer(), while inserting my shift to repository for switch, my shift id: "+replaceMessage.getShiftId()+", offer id: "+replaceMessage.getOfferShiftId());
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
				throw new ShfException(actionErrors);
			}
		}
		
		// attempt to switch shifts
		
		// populate OfferReplaceByCritrion object for switch
		OfferReplaceByCritrion offerReplaceByCritrion = null;
		Vector<String> shiftsId = new Vector<String>();
		shiftsId.add(String.valueOf(replaceMessage.getShiftId()));
		UserProfile userProfile = (UserProfile) request.getSession().getAttribute("userProfile");
		try {
			offerReplaceByCritrion = (simpleFactoryDao.populateOfferReplaceByCritrionFromReplaceCandidatesByShiftId(shiftsId)).get(0);
			offerReplaceByCritrion.setOffer(String.valueOf(replaceMessage.getOfferShiftId()));
			offerReplaceByCritrion.setOfferEmployeeIdNum(offerShift.getEmpIdNumber());
			offerReplaceByCritrion.setOfferStartTime(offerShift.getShiftStart());
			offerReplaceByCritrion.setOfferEndTime(offerShift.getShiftEnd());
			offerReplaceByCritrion.setOfferEmployeeId(String.valueOf(offerShift.getEmployeeId()));
			offerReplaceByCritrion.setOfferFullName(String.valueOf(offerShift.getFullName()));
			offerReplaceByCritrion.setOfferOrgUnitID(offerShift.getOrgUnitCode());
			offerReplaceByCritrion.setUserFirstName(userProfile.getFirstName());
			offerReplaceByCritrion.setUserLastName(userProfile.getLastName());
			offerReplaceByCritrion.setUserId(userProfile.getId());
			
		} catch (ShfException e) {
			logger.error("error in acceptOffer(), populating OfferReplaceByCritrion object for switch, my shift id: "+replaceMessage.getShiftId()+", offer id: "+replaceMessage.getOfferShiftId());
			ActionErrors actionErrors = new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
			//TODO remove my shift from repository
		}
		
		replaceModel.setsCtx(getsCtx());
	    replaceModel.acceptReplaceOffer(offerReplaceByCritrion, null);
	    request.setAttribute("messageAcceptOffer", "true");
		ActionErrors actionErrors = new ActionErrors();
		actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchSuccessful", null));
		throw new ShfException(actionErrors);

	}
	
	/**
	 * Function to determine whether switch offer is still relevant 
	 * @param replaceMessage
	 * @param acceptShift
	 * @param offerShift
	 * @return boolean
	 * @throws ShfException
	 */
	public boolean isOfferRelevant(ReplaceMassage replaceMessage, AgentDayBean acceptShift, AgentDayBean offerShift) throws ShfException {
		logger.debug("MessageModel: isOfferRelevant()");
		
		boolean isOfferRelevant = false;
		boolean isStillOffer2Me = false;
		boolean isSwitchMade = false;
		
		SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
		Vector<ReplaceCandidates> replaceCandidate = null;
		try{
			Vector<Integer> offerShiftId = new Vector<Integer>();
			offerShiftId.add(replaceMessage.getOfferShiftId());
			offerShiftId.add(replaceMessage.getShiftId());
			replaceCandidate =  simpleFactoryDao.getFromReplaceCandidatesByShiftId(offerShiftId);
		}catch(ShfException e){
			logger.error("error in isOfferRelevant(), while populating shifts from replaceCandidate for check: "+e.getMessage());
			ActionErrors actionErrors=new ActionErrors();
			actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.error.general",null));
			throw new ShfException(actionErrors);
		}
		
		if (replaceCandidate != null && replaceCandidate.size() > 0) {
			for (ReplaceCandidates replace : replaceCandidate) {
				if (replace.getShiftId() == replaceMessage.getOfferShiftId()) {	// check if still offering to me
					if (replace.getOffer() == replaceMessage.getShiftId()) {
						isStillOffer2Me = true;
					}
				} 
			}
		}
		if ( acceptShift.getEmployeeId() != replaceMessage.getEmpId() || offerShift.getEmployeeId() != replaceMessage.getOfferEmployeeId()) {		// if either sides already switched shifts
			isSwitchMade = true;
		}

		isOfferRelevant = (isStillOffer2Me && ! isSwitchMade);
		
		return isOfferRelevant;
	}

	public ServletContext getsCtx() {
		return sCtx;
	}

	public void setsCtx(ServletContext sCtx) {
		this.sCtx = sCtx;
	}
}
