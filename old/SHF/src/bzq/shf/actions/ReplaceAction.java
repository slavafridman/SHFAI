/*
 * Created on 22/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.actions;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.Calendar;
import java.util.Map;
import java.util.Vector;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.struts.action.ActionError;
import org.apache.struts.action.ActionErrors;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;
import bzq.shf.bean.AgentDayBean;
import bzq.shf.bean.ShfBaseBean;
import bzq.shf.dao.SimpleFactoryDao;
import bzq.shf.forms.MobileAuditRefForm;
import bzq.shf.forms.ShiftDataForm;
import bzq.shf.model.PlatformModel;
import bzq.shf.model.ReplaceModel;
import bzq.shf.model.ShiftDataModel;
import bzq.shf.profile.UserProfile;
import bzq.shf.transfer.OfferReplaceByCritrion;
import bzq.shf.transfer.ReplaceByCritrion;
import bzq.shf.transfer.ReplaceCandidates;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.SHFParameters;
import bzq.shf.utils.SHFSmsSender;
import bzq.shf.utils.SHFTableUtils;
import bzq.shf.utils.SHFUtils;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ReplaceAction extends BaseAction {

	/* (non-Javadoc)
	 * @see bzq.shf.actions.BaseAction#performAction(org.apache.struts.action.ActionMapping, org.apache.struts.action.ActionForm, javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
	public ActionForward performAction(
		ActionMapping mapping,
		ActionForm form,
		HttpServletRequest request,
		HttpServletResponse response)
		throws IOException, ServletException {
		
		ActionForward result=null;
		String param = (String)parameters.get("param");
		parameters.get("activity");
		ReplaceByCritrion replaceByCritrion = null;
		
		if (form!=null)	{		
			replaceByCritrion = (ReplaceByCritrion)form;			
		}
		
		if("searchForCandidate".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();
			Vector replaceCandidate = null;	    	 
			if(replaceByCritrion.getStartTime() == null)
				replaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if(replaceByCritrion.getEndTime() == null)
				replaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			if(replaceByCritrion.getEmployeeId() == null)
				replaceByCritrion.setEmployeeId(request.getParameter("employeeId"));
			
			String isNewShiftReplace = SHFUtils.getParameter(request.getParameter("isNewShiftReplace"),"0");	
			
			if ( "1".equals(isNewShiftReplace) && replaceModel.isExistInRepository(replaceByCritrion.getShiftId()) ) {
				
				result=mapping.findForward("manageReplace");
			} else if ( request.getParameter("switchPotential") != null && request.getParameter("switchPotential").equals("true") ) {	// if switch potential  then check if not reached offer limit
				
				String offersLimitAgaf = SHFParameters.getMaximumSelectForSwitchOffer(SHFTableUtils.getAgafCodeOf(replaceByCritrion.getEmployeeOrgUnit())).getValue();
				Vector<Map<String,String>> myOffersAmount = null;
				Vector<String> tmp = new Vector<String>();
				tmp.add(replaceByCritrion.getShiftId());
				try {
					myOffersAmount = replaceModel.getMaxOffersForShiftReplace( tmp);
				} catch (ShfException e) {
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
					saveErrors(request,actionErrors); 
					return result=mapping.findForward("manageReplace");
				}
				String currentShiftOffersAmount = (myOffersAmount != null) ? myOffersAmount.get(0).get(replaceByCritrion.getShiftId()) : "0";
				Integer offersLeft = Integer.valueOf(offersLimitAgaf) - Integer.valueOf(currentShiftOffersAmount);
				
				if (offersLeft > 0) {
					result=mapping.findForward("getSwitchPotential");
				} else {
					ActionErrors actionErrors = new ActionErrors();
					actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchOffersLimitReached"));
					saveErrors(request,actionErrors); 
					result=mapping.findForward("manageReplace");
				}
			}/* else if ( "1".equals(isNewShiftReplace) && replaceModel.isExistInRepository(replaceByCritrion.getShiftId()) ) {
				
				result=mapping.findForward("manageReplace");
			}*/ else {
				try{
					replaceCandidate = replaceModel.SearchCandidateForReplacement(replaceByCritrion);	
				}catch(ShfException e){
					saveErrors(request,e.getErrors());
				}
				if (replaceCandidate != null && replaceCandidate.size() < 1)  
					replaceCandidate = null;
				request.setAttribute("replaceCandidate",replaceCandidate);
				request.setAttribute("currentShiftNeedReplace",replaceByCritrion);			
				result=mapping.findForward("showCandidates");
			}				 		  	
		}else if("showManageReplace".equals(param)){
			ShfBaseBean bean=(ShfBaseBean)form;
			if(bean.getAllowedActivities().contains("replace_admin"))
				result=mapping.findForward("manageReplaceAdmin");
			else if(bean.getAllowedActivities().contains("replace_agent"))
				result=mapping.findForward("manageReplaceMokdan");
			else
				result=mapping.findForward("security");
				
		}else if("showManageReplaceMokdan".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();									
			Vector<OfferReplaceByCritrion> manageReplace = null;
			Vector<OfferReplaceByCritrion> allOffers = null;
			manageReplace = replaceModel.getShiftsInReplaceRepository(replaceByCritrion.getUserId(),replaceByCritrion.getAllowedMoked(),replaceByCritrion.getAllowedAgaf());
			allOffers = replaceModel.getShiftsInReplaceRepository(null ,replaceByCritrion.getAllowedMoked(),replaceByCritrion.getAllowedAgaf()); //Igal 2.2015 multiple offers update, get all replace offers to get offers to me
			Vector<OfferReplaceByCritrion> offers = null;
			
			if ( manageReplace != null ) {
				for (int i=0; i<manageReplace.size(); i++) {
					offers = new Vector<OfferReplaceByCritrion>();
					for ( int j=0; j<allOffers.size(); j++ ) {
						if ( ((OfferReplaceByCritrion)manageReplace.get(i)).getShiftId().equals( ((OfferReplaceByCritrion)allOffers.get(j)).getOffer() ) ) {
							offers.add((OfferReplaceByCritrion)allOffers.get(j));
						}
					}
					((OfferReplaceByCritrion)manageReplace.get(i)).setOffersToMe(offers);
				}
			}
			
			request.setAttribute("manageReplace",manageReplace);	
			result = mapping.findForward("success");			 		  	
		}else if("offerReplaceToCandidate".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();
			ReplaceByCritrion currentShiftNeedReplace = new ReplaceByCritrion(); 
			if(replaceByCritrion.getStartTime()==null)
				replaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if(replaceByCritrion.getEndTime()==null)
				replaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			currentShiftNeedReplace.setShiftId(request.getParameter("offer"));	
			currentShiftNeedReplace.setStartTime(SHFUtils.formatStringToDate(request.getParameter("offerStartTime"),"dd/MM/yyyy-HH:mm"));
			currentShiftNeedReplace.setEndTime(SHFUtils.formatStringToDate(request.getParameter("offerEndTime"),"dd/MM/yyyy-HH:mm"));
			currentShiftNeedReplace.setFullname(request.getParameter("offerFullname"));	
			currentShiftNeedReplace.setInnerJob(request.getParameter("innerJob"));
			currentShiftNeedReplace.setEmployeeId(request.getParameter("offerEmployeeId"));
			try {
				SHFSmsSender smsSender = new SHFSmsSender(null, null, getServlet().getServletContext());
				replaceModel.offerReplaceToCandidate(currentShiftNeedReplace, replaceByCritrion, smsSender);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.generalSuccessMsg", null));
				saveErrors(request,actionErrors); 
			} catch (ShfException e) {
				e.printStackTrace();
				saveErrors(request,e.getErrors()); 
			}
			HttpSession session = request.getSession();
			UserProfile userProfile = (UserProfile) session.getAttribute("userProfile");
			if ("true".equals(session.getAttribute("isMobile"))) {
				
				TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
				Vector<MobileAuditRefForm> mobileAuditRef = tablesContainer.getTable(TablesConstants.MOBILE_AUDIT_REF);
				String loginActionID = "";
				for (MobileAuditRefForm mobileAuditRefForm : mobileAuditRef) {
					if (SHFConstants.ACTION_OFFER_REPLACE.equals( mobileAuditRefForm.getDescription())) {
						loginActionID = mobileAuditRefForm.getCode();
						if (loginActionID != null && loginActionID != "") {
							PlatformModel pm = new PlatformModel();
							try {
								pm.insertMobileAudit(userProfile.getId(), Integer.parseInt(loginActionID));
							} catch (ShfException e) {
								logger.error("Error while inserting to MobileAudit table : " + e.getMessage() );
							}
						}
					}
				}
			}
			result=mapping.findForward("manageReplace");
		} else if("insertShiftToRepository".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();										    
			//String shiftId = ((ReplaceByCritrion)request.getSession().getAttribute("currentShiftNeedReplace")).getShiftId();
			String shiftId = replaceByCritrion.getShiftId();
			if (!replaceModel.isExistInRepository(shiftId))	{
				String note = SHFUtils.getParameter(request.getParameter("shiftNote"),"");
				if( note != "" ) {
					note = note.replaceAll("\\<.*?>","");
					note = note.replaceAll("&.*?;","");
				}
				replaceModel.insertShiftToRepository(shiftId, note);										
			}
			result=mapping.findForward("manageReplace");
						 		  							
		} else if("cancelUnCommitedOffer".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();		
			ReplaceByCritrion offerReplaceByCritrion = new ReplaceByCritrion();			
			offerReplaceByCritrion.setShiftId(request.getParameter("offer"));
			offerReplaceByCritrion.setEmployeeId(request.getParameter("offerEmployeeId"));			
			offerReplaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("offerStartTime"),"dd/MM/yyyy HH:mm"));			
			offerReplaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("offerEndTime"),"dd/MM/yyyy HH:mm"));
			offerReplaceByCritrion.setFullname(request.getParameter("offerFullname"));							    	        
			try {
				replaceModel.cancelReplaceToCandidate(replaceByCritrion,offerReplaceByCritrion);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.generalSuccessMsg", null));
				saveErrors(request,actionErrors); 
			} catch (ShfException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				saveErrors(request,e.getErrors()); 
			}		
			result=mapping.findForward("manageReplace");
 		  	
		} else if("acceptReplaceOffer".equals(param)){
		    ReplaceModel replaceModel = new ReplaceModel();						
			String note = SHFUtils.getParameter(request.getParameter("note"),"");
			OfferReplaceByCritrion offerReplaceByCritrion = (OfferReplaceByCritrion)replaceByCritrion;			
			if(offerReplaceByCritrion.getStartTime()==null)
				offerReplaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getEndTime()==null)							
				offerReplaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getOfferStartTime()==null)
				offerReplaceByCritrion.setOfferStartTime(SHFUtils.formatStringToDate(request.getParameter("offerStartTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getOfferEndTime()==null)						
				offerReplaceByCritrion.setOfferEndTime(SHFUtils.formatStringToDate(request.getParameter("offerEndTime"),"dd/MM/yyyy-HH:mm"));													    	        
			
			try{
				replaceModel.setsCtx(getServlet().getServletContext());
				replaceModel.acceptReplaceOffer((OfferReplaceByCritrion)offerReplaceByCritrion,note); // "offerReplaceByCritrion" is the agent who accepted
				
				HttpSession session = request.getSession();
				UserProfile userProfile = (UserProfile) session.getAttribute("userProfile");
				if ("true".equals(session.getAttribute("isMobile"))) {
					
					TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
					Vector<MobileAuditRefForm> mobileAuditRef = tablesContainer.getTable(TablesConstants.MOBILE_AUDIT_REF);
					String loginActionID = "";
					for (MobileAuditRefForm mobileAuditRefForm : mobileAuditRef) {
						if (SHFConstants.ACTION_OFFER_ACCEPT.equals( mobileAuditRefForm.getDescription())) {
							loginActionID = mobileAuditRefForm.getCode();
							if (loginActionID != null && loginActionID != "") {
								PlatformModel pm = new PlatformModel();
								try {
									pm.insertMobileAudit(userProfile.getId(), Integer.parseInt(loginActionID));
								} catch (ShfException e) {
									logger.error("Error while inserting to MobileAudit table : " + e.getMessage() );
								}
							}
						}
					}
				}
				
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.switchSuccessful", null));
				saveErrors(request,actionErrors);
				
				return result = mapping.findForward("success");
				
			}catch (ShfException e) {
					saveErrors(request,e.getErrors()); 
					return result = mapping.findForward("fail"); 	
			}
			
		} else if("cancelUnCommitedShiftReplace".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();										    	        
			if ( replaceModel.cancelShiftReplace(replaceByCritrion) ) {
				ActionErrors actionErrors=new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX,new ActionError("shf.success.generalSuccessMsg",null));
				saveErrors(request,actionErrors);
			}
			result=mapping.findForward("manageReplace"); 		  	
		} else if("rejectReplaceOffer".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();									
			String note = SHFUtils.getParameter(request.getParameter("note"),"");
			OfferReplaceByCritrion offerReplaceByCritrion = (OfferReplaceByCritrion)replaceByCritrion;
			if(offerReplaceByCritrion.getStartTime()==null)
				offerReplaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getEndTime()==null)							
				offerReplaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getOfferStartTime()==null)
				offerReplaceByCritrion.setOfferStartTime(SHFUtils.formatStringToDate(request.getParameter("offerStartTime"),"dd/MM/yyyy-HH:mm"));
			if(offerReplaceByCritrion.getOfferEndTime()==null)						
				offerReplaceByCritrion.setOfferEndTime(SHFUtils.formatStringToDate(request.getParameter("offerEndTime"),"dd/MM/yyyy-HH:mm"));			
			try {
				replaceModel.rejectReplaceOffer(offerReplaceByCritrion,note);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.generalSuccessMsg", null));
				saveErrors(request,actionErrors); 
			} catch (ShfException e) {
				e.printStackTrace();
				saveErrors(request,e.getErrors()); 
			}
			if ( request.getParameter("screen") != null && ((String)request.getParameter("screen")).equals("manageReplace")) {
				result=mapping.findForward("manageReplace");
			} else {
				result=mapping.findForward("success");
			}
		} else if("lookForOffers".equals(param)){
			ReplaceModel replaceModel = new ReplaceModel();									
			Vector shiftsOffer = null;
			if(replaceByCritrion.getStartTime()==null)
				replaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if(replaceByCritrion.getEndTime()==null)							
				replaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			replaceByCritrion.setSite(request.getParameter("site"));
			replaceByCritrion.setInnerJob(request.getParameter("innerJob"));
			shiftsOffer = replaceModel.lookForOffers(replaceByCritrion.getShiftId());			
			request.setAttribute("myShift",replaceByCritrion);
			request.setAttribute("shiftsOffer",shiftsOffer);			
			result=mapping.findForward("success");
		} else if ("showManageReplaceAdmin".equals(param))	{
			ReplaceModel replaceModel = new ReplaceModel();
			Vector<OfferReplaceByCritrion> manageReplace = null;
//			Vector<String> shiftsIdVec = null;
			Vector<OfferReplaceByCritrion> offers = null;
			
			manageReplace = replaceModel.getShiftsInReplaceRepository(null,replaceByCritrion.getAllowedMoked() , replaceByCritrion.getAllowedAgaf());
			
			if ( manageReplace != null ) {
				for (int i=0; i<manageReplace.size(); i++) {
					offers = new Vector<OfferReplaceByCritrion>();
					for ( int j=0; j<manageReplace.size(); j++ ) {
						if ( ((OfferReplaceByCritrion)manageReplace.get(i)).getShiftId().equals( ((OfferReplaceByCritrion)manageReplace.get(j)).getOffer() ) ) {
							offers.add((OfferReplaceByCritrion)manageReplace.get(j));
						}
					}
					((OfferReplaceByCritrion)manageReplace.get(i)).setOffersToMe(offers);
				}
			}
			request.setAttribute("manageReplace",manageReplace);	
			result = mapping.findForward("success");
			
		} else if("checkShiftReplace".equals(param)) {
			response.setHeader("Cache-Control","no-cache");
			response.setHeader("Pragma","no-cache"); 
			ReplaceModel replaceModel = new ReplaceModel(replaceByCritrion);
			String shiftId = request.getParameter("shiftId");
			try{
				replaceModel.checkValidShiftCandidate(Long.parseLong(shiftId));
				result=mapping.findForward("success");
				response.getWriter().write("success");
			}catch(ShfException e){
				result=mapping.findForward("fail");
     			response.getWriter().write("fail");
				saveErrors(request,e.getErrors());
			}
		} else if ( "showSwitchPotential".equals(param) ) {
			if(replaceByCritrion.getFullname() != null){
				replaceByCritrion.setFullname(URLDecoder.decode(replaceByCritrion.getFullname(), "WINDOWS-1255"));
			}
			
//			if ( userProfile != null && userProfile.getAllowedReplace() != null && userProfile.getAllowedReplace().equals("1") ) {
//				request.setAttribute( "AllowedReplace", userProfile.getAllowedReplace() );
//			} else {
//				ActionErrors actionErrors = new ActionErrors();
//				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.replaceUserNotAllowed", null));
//				saveErrors(request,actionErrors);
//				result=mapping.findForward("userNotAllowedReplace");
//				return result;
//			}
			if( replaceByCritrion.getStartTime() == null )
				replaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if( replaceByCritrion.getEndTime() == null )
				replaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
			if( replaceByCritrion.getSwitchPotentialFormSite() == null )
				replaceByCritrion.setSwitchPotentialFormSite( SHFTableUtils.getUnitCodeOfSite(replaceByCritrion.getSite()) );
			if( replaceByCritrion.getInnerJob() == null || replaceByCritrion.getEmployeeId() == null || replaceByCritrion.getFullname() == null) {	// if no innerJob then get it and store for next times
				try {
					AgentDayBean myDay = ShiftDataModel.populateShift(Long.parseLong(replaceByCritrion.getShiftId()));
					if (myDay != null) {
						if( replaceByCritrion.getInnerJob() == null ) {
								replaceByCritrion.setInnerJob(myDay.getInnerJobId());
						}
						if( replaceByCritrion.getEmployeeId() == null ) {
								replaceByCritrion.setEmployeeId(String.valueOf(myDay.getEmployeeId()));
						}
						if( replaceByCritrion.getFullname() == null ) {
							replaceByCritrion.setFullname(myDay.getFirstName()+" "+myDay.getLastName());
						}
					}
				} catch (Exception e) {	// redirect to shifts list with error
					// TODO: handle exception
				}
			}
			if( replaceByCritrion.getFullname() == null )
				replaceByCritrion.setFullname(request.getParameter("firstName")+" "+request.getParameter("lastName"));
			
			request.setAttribute( "myReplaceByCritrion", replaceByCritrion ); // for form
			if (replaceByCritrion.getSwitchPotentialList() != null && replaceByCritrion.getSwitchPotentialList().length() > 0 ) {
				result=mapping.findForward("switchPotentialSendRequests");
				return result;
			}

			// 1st we need get all shifts (site / all sites from allowed agaf, same innerJob, same date)
			AppResources appRes=AppResources.getInstance();	// get moked units start (since units usually restricted to allowed only, we need manually get them all)
			TablesContainer tc = appRes.getTablesContainer();
			Vector<bzq.shf.forms.OrgUnitTableForm> allUnits = tc.getTable("unitCode");
			
			Vector<String> allowedUnits = userProfile.getAllowedUnits();
			
			// prepare allowed agaf units
			Vector<bzq.shf.forms.OrgUnitTableForm> myAgafUnits = new Vector<bzq.shf.forms.OrgUnitTableForm>();	
			for (bzq.shf.forms.OrgUnitTableForm unit : allUnits) {
				for (String allowedUnitCode : allowedUnits) {
					if ( unit.getType() != null && unit.getType().equals(SHFConstants.AGAF_UNIT ) && allowedUnitCode == unit.getCode()) {
						myAgafUnits.add(unit);
					}
				}
			}
			
			// using allowed agaf get relevant moked units
			Vector<bzq.shf.forms.OrgUnitTableForm> mokedUnits = new Vector<bzq.shf.forms.OrgUnitTableForm>();
			for (bzq.shf.forms.OrgUnitTableForm unit : allUnits) {
				for (bzq.shf.forms.OrgUnitTableForm myAgafUnit : myAgafUnits) {
					if ( unit.getType() != null && unit.getType().equals(SHFConstants.MOKED_UNIT ) && unit.getParent().equals(myAgafUnit.getCode()) ) {
						mokedUnits.add(unit);
					}
				}
			}
			
			// we going to use existing method from ShiftDataModel class, lets prepare ShiftDataForm for it
			ShiftDataForm shiftForm = new ShiftDataForm();
			shiftForm.setMyAgafMokedUnits(mokedUnits);	// indicate coming from switch potential and thus avoid using allowed units (which is default)
//			shiftForm.setSwitchPotentialMyUserId(replaceByCritrion.getEmployeePersonalId());	// not to include my shifts
			
			Calendar AttendanceDate = Calendar.getInstance();
			AttendanceDate.setTime(replaceByCritrion.getStartTime()); 
			AttendanceDate.set(Calendar.HOUR, 0);
			AttendanceDate.set(Calendar.MINUTE, 0);
			AttendanceDate.set(Calendar.SECOND, 0);
			shiftForm.setAttendanceDate(AttendanceDate.getTime());
			
			shiftForm.setTimeFrom("00:01");
			shiftForm.setTimeTo("23:59");
			shiftForm.setMoked( replaceByCritrion.getSwitchPotentialFormSite() );
			shiftForm.setTeam( new String[]{"00"} );
			shiftForm.setInnerJob( new String[]{replaceByCritrion.getInnerJob()} );
			shiftForm.setSwitchPotential(true);	// indicate switch potential mode
			
			ShiftDataModel myShiftDataModel = new ShiftDataModel(shiftForm);	// form ready, create the model
			Vector<AgentDayBean> allDayShifts = null;
			Vector<OfferReplaceByCritrion> shiftsInRepository = null;
			Vector<AgentDayBean> allDayShiftsAfterCheck = null;
			Vector<AgentDayBean> switchPotentials = null;	// the final array for display
			Vector<Map<String,String>> myOffersAmount = null;
			try {
				allDayShifts = myShiftDataModel.populateShiftList();	// get all shifts (not in repository)
				ReplaceModel replaceModel = new ReplaceModel();
				allDayShiftsAfterCheck = replaceModel.checkShiftsForSwitch( allDayShifts, replaceByCritrion );	// check'em and filter
				
				Vector<Integer> myShiftId = new Vector<Integer>();	// remove shifts already offered to
				myShiftId.add(Integer.valueOf(replaceByCritrion.getShiftId()));
//				if (allDayShiftsAfterCheck != null && allDayShiftsAfterCheck.size() > 0) {
//					for (AgentDayBean dayBean : allDayShiftsAfterCheck) {
//						
//					}
//				}
				SimpleFactoryDao simpleFactoryDao = SimpleFactoryDao.getDaoFactory(SimpleFactoryDao.REPLACE_BY_CRITRION);
				Vector<ReplaceCandidates>  myShiftsInRep = simpleFactoryDao.getFromReplaceCandidatesByShiftId(myShiftId);
				if (myShiftsInRep != null && myShiftsInRep.size() > 0) {
					if (allDayShiftsAfterCheck != null && allDayShiftsAfterCheck.size() > 0 ) {
						switchPotentials = new Vector<AgentDayBean>();
						for (AgentDayBean dayBean : allDayShiftsAfterCheck) {
							boolean alreadyOffered = false;
							for (ReplaceCandidates replaceCandidate : myShiftsInRep) {
								if (dayBean.getAgentDayId() == replaceCandidate.getOffer()) {
									alreadyOffered = true;
									break;
								}
							}
							if ( ! alreadyOffered) {
								switchPotentials.add(dayBean);
							}
						}
					}
				} else {
					switchPotentials = allDayShiftsAfterCheck;
				}
				
				Vector<String> tmp = new Vector<String>();	// prepare offers selection limit
				tmp.add(replaceByCritrion.getShiftId());
				myOffersAmount = replaceModel.getMaxOffersForShiftReplace( tmp);
			} catch (ShfException e) {	// redirect to my shifts list with error
				// TODO Auto-generated catch block
				e.printStackTrace();
				
			}
			
			String offersLimitAgaf = SHFParameters.getMaximumSelectForSwitchOffer(SHFTableUtils.getAgafCodeOf(replaceByCritrion.getEmployeeOrgUnit())).getValue();
			String currentShiftOffersAmount = (myOffersAmount != null) ? myOffersAmount.get(0).get(replaceByCritrion.getShiftId()) : "0";
			Integer offersLeft = Integer.valueOf(offersLimitAgaf) - Integer.valueOf(currentShiftOffersAmount);
			
			request.setAttribute( "switchPotentials", switchPotentials );
			request.setAttribute( "offersLeft",  offersLeft);
			request.setAttribute( "offersLimitAgaf",  offersLimitAgaf);
			
			result=mapping.findForward("showSwitchPotential");
			
		} else if ( "SwitchPotentialSendRequests".equals(param) ) {

			ReplaceByCritrion myReplaceByCritrion = (ReplaceByCritrion)request.getAttribute("myReplaceByCritrion");
			if(replaceByCritrion.getFullname() != null){
				replaceByCritrion.setFullname(URLDecoder.decode(replaceByCritrion.getFullname(), "WINDOWS-1255"));
			}

			if( myReplaceByCritrion.getStartTime() == null )
				myReplaceByCritrion.setStartTime(SHFUtils.formatStringToDate(request.getParameter("startTime"),"dd/MM/yyyy-HH:mm"));
			if( myReplaceByCritrion.getEndTime() == null )
				myReplaceByCritrion.setEndTime(SHFUtils.formatStringToDate(request.getParameter("endTime"),"dd/MM/yyyy-HH:mm"));
//			if( replaceByCritrion.getSwitchPotentialFormSite() == null )
//				replaceByCritrion.setSwitchPotentialFormSite( SHFTableUtils.getUnitCodeOfSite(replaceByCritrion.getSite()) );
//			if( myReplaceByCritrion.getFullname() == null )
//				myReplaceByCritrion.setFullname(request.getParameter("firstName")+" "+request.getParameter("lastName"));
			
			
			Vector<ReplaceByCritrion> offerToVec = new Vector<ReplaceByCritrion>();
//			ReplaceByCritrion myReplaceByCritrion = (ReplaceByCritrion)request.getAttribute("myReplaceByCritrion");
//			ReplaceByCritrion myReplaceByCritrion2 = (ReplaceByCritrion)request.getSession().getAttribute( "myReplaceByCritrion");
			Vector<java.util.Map> paramMap = SHFUtils.urlToParamMap(replaceByCritrion.getSwitchPotentialList());
			
			
			if (paramMap != null && paramMap.size() > 0) {
				for (int i = 0; i < paramMap.size(); i++) {
					ReplaceByCritrion offerToBean = new ReplaceByCritrion();
					if ( paramMap.get(i).get("activity") != null  ) {
						offerToBean.setActivity( (String)paramMap.get(i).get("activity") );
					}
					if ( paramMap.get(i).get("shiftId") != null ) {
						offerToBean.setShiftId( (String)paramMap.get(i).get("shiftId") );
					}
					if ( paramMap.get(i).get("endTime") != null ) {
						offerToBean.setEndTime( SHFUtils.formatStringToDate((String)paramMap.get(i).get("endTime"), "dd/MM/yyyy-HH:mm")  );
					} 
					if ( paramMap.get(i).get("employeeId") != null ) {
						offerToBean.setEmployeeId( (String)paramMap.get(i).get("employeeId") );
					} 
					if ( paramMap.get(i).get("startTime") != null ) {
						offerToBean.setStartTime( SHFUtils.formatStringToDate((String)paramMap.get(i).get("startTime"), "dd/MM/yyyy-HH:mm")  );
					}
					offerToVec.add(offerToBean);
				}
			}
			
			ReplaceModel replaceModel = new ReplaceModel();
	
			try {
		    	
				String url = request.getRequestURL().toString();
				String baseURL = url.substring(0, url.length() - request.getRequestURI().length()) + request.getContextPath() + "/";
				
				SHFSmsSender smsSender = new SHFSmsSender(null, null, getServlet().getServletContext());
				
				replaceModel.offerReplaceToMulitpleCandidates(replaceByCritrion, offerToVec, baseURL, smsSender);
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.success.generalSuccessMsg"));
				saveErrors(request,actionErrors); 
			} catch (ShfException e) {
				ActionErrors actionErrors = new ActionErrors();
				actionErrors.add(SHFConstants.APP_ERROR_PREFIX, new ActionError("shf.error.general"));
				saveErrors(request,actionErrors); 
			}
			
			HttpSession session = request.getSession();
			UserProfile userProfile = (UserProfile) session.getAttribute("userProfile");
			if ("true".equals(session.getAttribute("isMobile"))) {
				
				TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
				Vector<MobileAuditRefForm> mobileAuditRef = tablesContainer.getTable(TablesConstants.MOBILE_AUDIT_REF);
				String loginActionID = "";
				for (MobileAuditRefForm mobileAuditRefForm : mobileAuditRef) {
					if (SHFConstants.ACTION_OFFER_REPLACE.equals( mobileAuditRefForm.getDescription())) {
						loginActionID = mobileAuditRefForm.getCode();
						if (loginActionID != null && loginActionID != "") {
							PlatformModel pm = new PlatformModel();
							try {
								pm.insertMobileAudit(userProfile.getId(), Integer.parseInt(loginActionID));
							} catch (ShfException e) {
								logger.error("Error while inserting to MobileAudit table : " + e.getMessage() );
							}
						}
					}
				}
			}

			
			result=mapping.findForward("manageReplace");
		}
		return result;
	}
	

}

