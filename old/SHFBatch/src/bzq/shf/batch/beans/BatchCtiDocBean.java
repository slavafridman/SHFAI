/*
 * Created on 18/01/2010
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch.beans;

import java.util.Date;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class BatchCtiDocBean extends BatchDocBean {
		
	public BatchCtiDocBean(){
	}
		public BatchCtiDocBean(BatchDocBean docBean){
			this.setProcessDocKey(docBean.getProcessDocKey());
			this.setProcessKey(docBean.getProcessKey());
			this.setExecutionDate(docBean.getExecutionDate());
			this.setTriggerDate(docBean.getTriggerDate());
			this.setGenerationNumber(docBean.getGenerationNumber());
			this.setRecordsScanned(docBean.getRecordsScanned());
			this.setRecordsAdded(docBean.getRecordsAdded());
			this.setRecordsModified(docBean.getRecordsModified());
			this.setRecordsDeleted(docBean.getRecordsDeleted());
			this.setRecordsInvalid(docBean.getRecordsInvalid());
			this.setProcessStatus(docBean.getProcessStatus());
			this.setOperationPrm(docBean.getOperationPrm());
			this.setLastCommitRecord(docBean.getLastCommitRecord());
			this.setStepInProgress(docBean.getStepInProgress());
			this.setFileName(docBean.getFileName());
			this.setSourceKey(docBean.getSourceKey());
			this.setDocDesc(docBean.getDocDesc());
			this.setProcessDescription(docBean.getProcessDescription());// For daily report S.F.
		}
		static {		
			fieldsMappping.put("START_PROCESS_DATE","startProcessDate");
			fieldsMappping.put("END_PROCESS_DATE","endProcessDate");
			fieldsMappping.put("REC_WITHOUT_SATRT","recWithoutSatrt");
			fieldsMappping.put("REC_WITHOUT_END","recWithoutEnd");
			fieldsMappping.put("REC_SHIFT_OK","recShiftOk");
			fieldsMappping.put("REC_WITHOUT_START_END","recWithoutStartEnd");
			fieldsMappping.put("REC_LONG_SHIFT","recLongShift");
			fieldsMappping.put("REC_CTI_SHF_MATCH","recCtiShfMatch");
			fieldsMappping.put("REC_BRIEF","recBrief");
			fieldsMappping.put("REC_BRIEF_NO_USER","recBriefNoUser");
			fieldsMappping.put("REC_BRIEF_NO_UNIT","recBriefNoUnit");
			fieldsMappping.put("REC_SYSTEM","recSystem");
			fieldsMappping.put("REC_SYSTEM_NO_USER","recSystemNoUser");
			fieldsMappping.put("REC_SYSTEM_NO_UNIT","recSystemNoUnit");
			fieldsMappping.put("REC_SAP_LINE","recSapLine");
			fieldsMappping.put("REC_SAP_REQ","sapReqId");
			fieldsMappping.put("REC_SAP_USERS","recSapUsers");
			fieldsMappping.put("P1_PART_NO_START", "p1PartNoStart");
			fieldsMappping.put("P1_PART_NO_END","p1PartNoEnd");
			fieldsMappping.put("P2_4_OK_SHIFT","p2_4_OkShift");
			fieldsMappping.put("P2_4_SHIFT_NO_START","p2_4_ShiftNoStart");
			fieldsMappping.put("P2_4_SHIFT_NO_END","p2_4_ShiftNoEnd");
			fieldsMappping.put("P2_4_LONG_SHIFT","p2_4_LongShift");
			fieldsMappping.put("P3_CTI_WITH_SHF","p3_CtiWithShf");
			fieldsMappping.put("P3_TIDRUCH","p3Tidruch");
			fieldsMappping.put("P3_TIDRUCH_NO_USER","p3TidruchNoUser");
			fieldsMappping.put("P3_TIDRUCH_NO_ORG","p3TidruchNoOrg");
			fieldsMappping.put("P3_SUM_SYSTEM","p3SumSystem");
			fieldsMappping.put("P3_SYSTEM_NO_USER","p3SystemNoUser");
			fieldsMappping.put("P3_SYSTEM_NO_ORG","p3SystemNoOrg");
			fieldsMappping.put("P4_SUM_USERS","p4SumUsers");
			}
	
		public Date startProcessDate;
		public Date endProcessDate;
		public long recWithoutSatrt;
		public long recWithoutEnd;
		public long recShiftOk;
		public long recWithoutStartEnd;
		public long recLongShift;
		public long recCtiShfMatch;
		public long recBrief;
		public long recBriefNoUser;
		public long recBriefNoUnit;
		public long recSystem;
		public long recSystemNoUser;
		public long recSystemNoUnit;
		public long recSapLine;
		public long sapReqId;
		public long recSapUsers;
		public long p1PartNoStart;
		public long p1PartNoEnd;
		public long p2_4_OkShift;
		public long p2_4_ShiftNoStart;
		public long p2_4_ShiftNoEnd;
		public long p2_4_LongShift;
		public long p3_CtiWithShf;
		public long p3Tidruch;
		public long p3TidruchNoUser;
		public long p3TidruchNoOrg;
		public long p3SumSystem;
		public long p3SystemNoUser;
		public long p3SystemNoOrg;
		public long p4SumUsers;
		
		
		
		public long getP3TidruchNoUser() {
			return p3TidruchNoUser;
		}
		public void setP3TidruchNoUser(long tidruchNoUser) {
			p3TidruchNoUser = tidruchNoUser;
		}
		public long getP3TidruchNoOrg() {
			return p3TidruchNoOrg;
		}
		public void setP3TidruchNoOrg(long tidruchNoOrg) {
			p3TidruchNoOrg = tidruchNoOrg;
		}
		public long getP1PartNoStart() {
			return p1PartNoStart;
		}
		public void setP1PartNoStart(long partNoStart) {
			p1PartNoStart = partNoStart;
		}
		public long getP1PartNoEnd() {
			return p1PartNoEnd;
		}
		public void setP1PartNoEnd(long partNoEnd) {
			p1PartNoEnd = partNoEnd;
		}
		public long getP2_4_OkShift() {
			return p2_4_OkShift;
		}
		public void setP2_4_OkShift(long okShift) {
			p2_4_OkShift = okShift;
		}
		public long getP2_4_ShiftNoStart() {
			return p2_4_ShiftNoStart;
		}
		public void setP2_4_ShiftNoStart(long shiftNoStart) {
			p2_4_ShiftNoStart = shiftNoStart;
		}
		public long getP2_4_ShiftNoEnd() {
			return p2_4_ShiftNoEnd;
		}
		public void setP2_4_ShiftNoEnd(long shiftNoEnd) {
			p2_4_ShiftNoEnd = shiftNoEnd;
		}
		public long getP2_4_LongShift() {
			return p2_4_LongShift;
		}
		public void setP2_4_LongShift(long longShift) {
			p2_4_LongShift = longShift;
		}
		public long getP3_CtiWithShf() {
			return p3_CtiWithShf;
		}
		public void setP3_CtiWithShf(long ctiWithShf) {
			p3_CtiWithShf = ctiWithShf;
		}
		public long getP3Tidruch() {
			return p3Tidruch;
		}
		public void setP3Tidruch(long tidruch) {
			p3Tidruch = tidruch;
		}
		public long getP3SumSystem() {
			return p3SumSystem;
		}
		public void setP3SumSystem(long sumSystem) {
			p3SumSystem = sumSystem;
		}
		public long getP3SystemNoUser() {
			return p3SystemNoUser;
		}
		public void setP3SystemNoUser(long systemNoUser) {
			p3SystemNoUser = systemNoUser;
		}
		public long getP3SystemNoOrg() {
			return p3SystemNoOrg;
		}
		public void setP3SystemNoOrg(long systemNoOrg) {
			p3SystemNoOrg = systemNoOrg;
		}
		public long getP4SumUsers() {
			return p4SumUsers;
		}
		public void setP4SumUsers(long sumUsers) {
			p4SumUsers = sumUsers;
		}
		/**
		 * @return
		 */
		public Date getEndProcessDate() {
			return endProcessDate;
		}

		/**
		 * @return
		 */
		public Date getStartProcessDate() {
			return startProcessDate;
		}

		/**
		 * @param date
		 */
		public void setEndProcessDate(Date date) {
			endProcessDate = date;
		}

		/**
		 * @param date
		 */
		public void setStartProcessDate(Date date) {
			startProcessDate = date;
		}

		/**
		 * @return
		 */
		public long getRecBrief() {
			return recBrief;
		}

		/**
		 * @return
		 */
		public long getRecBriefNoUnit() {
			return recBriefNoUnit;
		}

		/**
		 * @return
		 */
		public long getRecBriefNoUser() {
			return recBriefNoUser;
		}

		/**
		 * @return
		 */
		public long getRecCtiShfMatch() {
			return recCtiShfMatch;
		}

		/**
		 * @return
		 */
		public long getRecLongShift() {
			return recLongShift;
		}

		/**
		 * @return
		 */
		public long getRecSapLine() {
			return recSapLine;
		}

		/**
		 * @return
		 */
		public long getRecSapUsers() {
			return recSapUsers;
		}

		/**
		 * @return
		 */
		public long getRecShiftOk() {
			return recShiftOk;
		}

		/**
		 * @return
		 */
		public long getRecSystem() {
			return recSystem;
		}

		/**
		 * @return
		 */
		public long getRecSystemNoUnit() {
			return recSystemNoUnit;
		}

		/**
		 * @return
		 */
		public long getRecSystemNoUser() {
			return recSystemNoUser;
		}

		/**
		 * @return
		 */
		public long getRecWithoutEnd() {
			return recWithoutEnd;
		}

		/**
		 * @return
		 */
		public long getRecWithoutSatrt() {
			return recWithoutSatrt;
		}

		/**
		 * @return
		 */
		public long getRecWithoutStartEnd() {
			return recWithoutStartEnd;
		}

		/**
		 * @param l
		 */
		public void setRecBrief(long l) {
			recBrief = l;
		}

		/**
		 * @param l
		 */
		public void setRecBriefNoUnit(long l) {
			recBriefNoUnit = l;
		}

		/**
		 * @param l
		 */
		public void setRecBriefNoUser(long l) {
			recBriefNoUser = l;
		}

		/**
		 * @param l
		 */
		public void setRecCtiShfMatch(long l) {
			recCtiShfMatch = l;
		}

		/**
		 * @param l
		 */
		public void setRecLongShift(long l) {
			recLongShift = l;
		}

		/**
		 * @param l
		 */
		public void setRecSapLine(long l) {
			recSapLine = l;
		}

		/**
		 * @param l
		 */
		public void setRecSapUsers(long l) {
			recSapUsers = l;
		}

		/**
		 * @param l
		 */
		public void setRecShiftOk(long l) {
			recShiftOk = l;
		}

		/**
		 * @param l
		 */
		public void setRecSystem(long l) {
			recSystem = l;
		}

		/**
		 * @param l
		 */
		public void setRecSystemNoUnit(long l) {
			recSystemNoUnit = l;
		}

		/**
		 * @param l
		 */
		public void setRecSystemNoUser(long l) {
			recSystemNoUser = l;
		}

		/**
		 * @param l
		 */
		public void setRecWithoutEnd(long l) {
			recWithoutEnd = l;
		}

		/**
		 * @param l
		 */
		public void setRecWithoutSatrt(long l) {
			recWithoutSatrt = l;
		}

		/**
		 * @param l
		 */
		public void setRecWithoutStartEnd(long l) {
			recWithoutStartEnd = l;
		}

		/**
		 * @return
		 */
		public long getSapReqId() {
			return sapReqId;
		}

		/**
		 * @param l
		 */
		public void setSapReqId(long l) {
			sapReqId = l;
		}

}
